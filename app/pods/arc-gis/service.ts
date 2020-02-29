import Service from '@ember/service'

import { set, get } from '@ember/object'

import ENV from 'cloudscape/config/environment'
import { getLayer, queryFeatures } from '@esri/arcgis-rest-feature-service'
import { IAuthenticationManager, request } from '@esri/arcgis-rest-request'
import { ArcGisServiceObject } from './objects/service'
import { ArcGisServiceLayer } from './objects/layer'
import { task } from 'ember-concurrency-decorators'

import Maps from 'cloudscape/pods/maps/service'
import { inject as service } from '@ember-decorators/service'
import { extractRelevantFields, processLayer } from 'arcgis-mapbox-utils/lib/utils'
import Session from 'cloudscape/pods/session/service'

interface IFolderResponse {
    currentVersion: number
    folders: string[]
    services: ArcGisServiceObject[]
}

class OldSkoolAuthenticationProvider implements IAuthenticationManager {
    constructor(apiAccessToken: string) {
        this.apiAccessToken = apiAccessToken
    }

    apiAccessToken: string

    portal = ENV.APP.lendLeaseArcGisServer
    async getToken(): Promise<string> {
        const referer = window.location.toString()

        const response = await fetch(`${ENV.APP.apiUrl}/v7/arcgis/tokens`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiAccessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ referer }),
        }).then(r => r.json())

        return response.token
    }
}

export default class ArcGis extends Service {
    @service
    maps!: Maps

    @service
    session!: Session

    accessToken!: string

    init() {
        super.init()
        const authProvider = new OldSkoolAuthenticationProvider(this.session.accessToken)
        authProvider.getToken().then(token => {
            set(this, 'accessToken', token)
        })
    }

    serverUrl = ENV.APP.lendLeaseArcGisServer
    authenticationProvider = new OldSkoolAuthenticationProvider(this.session.accessToken)
    _serviceRegistry: ArcGisServiceObject[] = []

    // https://<host>/<site>/rest/services/<folder>/<serviceName>/<serviceType>

    _urlForLayer(service: ArcGisServiceObject, layerId: number = 0) {
        return `${this._urlForService(service)}/${layerId}`
    }

    _urlForService({ name: serviceName, type: serviceType }: ArcGisServiceObject) {
        return `${this.serverUrl}/${serviceName}/${serviceType}`
    }

    _urlForFolder(folderName: string) {
        return `${this.serverUrl}/${folderName}`
    }

    private async _getFolder(folderName: string): Promise<IFolderResponse> {
        console.log('get folder')
        return await request(this._urlForFolder(folderName), {
            authentication: this.authenticationProvider,
        })
    }

    async loadServicesForFolder(folderName: string): Promise<ArcGisServiceObject[]> {
        console.log('get services for folder')
        if (this._serviceRegistry.length === 0) {
            const { services } = await this._getFolder(folderName)
            this._serviceRegistry.pushObjects(
                services.map(service => new ArcGisServiceObject(service)),
            )
        }

        return this._serviceRegistry
    }

    private async _getServiceLegend(service: ArcGisServiceObject) {
        console.log('get service legend')
        return await request(`${this._urlForService(service)}/legend`, {
            authentication: this.authenticationProvider,
        })
    }

    private async _getService(service: ArcGisServiceObject) {
        console.log('get service')

        return await request(this._urlForService(service), {
            authentication: this.authenticationProvider,
        })
    }

    async loadLayersForService(service: ArcGisServiceObject): Promise<ArcGisServiceLayer[]> {
        console.log('get layers for service')
        if (!service._fullObject) {
            const legend = await this._getServiceLegend(service)

            service.populateFieldsFromFullResponse(legend)
        }

        return service.layers
    }

    async getLayer(service: ArcGisServiceObject, layer: ArcGisServiceLayer) {
        console.log('get layer')

        if (!layer._fullObject) {
            const response = await getLayer(`${this._urlForLayer(service, layer.layerId)}`, {
                authentication: this.authenticationProvider,
            })
            // hook in here
            const data = extractRelevantFields(response)

            const actions = await processLayer(data)

            layer.populateFieldsFromFullResponse({ actions })
        }

        return layer
    }

    // map box specific stuff
    // layerUrlForService(service: ArcGisServiceObject, layerId: number = 0) {
    //     return `${this._urlForLayer(service, layerId)}/query?where=1=1&outFields=*&outSR=4326&token=${this.accessToken}&f=geojson`
    // }

    @task
    *toggleLayerVisibility(service: ArcGisServiceObject, layer?: ArcGisServiceLayer) {
        const layerId = layer ? layer.layerId : 0

        const layerName = `${service.name}/${layerId}`
        console.log(`LAYER NAME ${layerName}`)

        if (service.type === 'ImageServer') {
            if (service.visible) {
                this.maps.removeArcGisLayer('project-map', layerName)
                set(service, 'visible', false)
            } else {
                const serviceUrl = this.urlForImageService(service)
                yield this.maps.addArcGisImageLayer('project-map', layerName, serviceUrl)
                // wait for map event here if succcessfull
                set(service, 'visible', true)
            }
        }

        if (service.type === 'MapServer' && layer) {
            if (layer.visible) {
                this.maps.removeArcGisLayer('project-map', layerName)
                set(layer, 'visible', false)
            } else {
                try {
                    yield this.getLayer(service, layer)
                    yield this.loadLayerDataForService(service, layer)
                } catch (error) {
                    set(layer, 'apiError', true)
                    console.error(error)
                    throw error
                }

                yield this.maps.addArcGisLayer('project-map', layerName, layer)

                set(layer, 'visible', true)
            }
        }
    }

    urlForImageService(service: ArcGisServiceObject) {
        return `${this.serverUrl}/${service.name}/${
            service.type
        }/exportImage?bbox={bbox-epsg-3857}&token=${
            this.accessToken
        }&size=256,256&imageSR=3857&bboxSR=3857&format=png&transparent=true&f=image`
    }

    async loadLayerDataForService(service: ArcGisServiceObject, layer: Layer) {
        console.log('loading geojson')
        if (layer.data) {
            return layer.data
        }

        const url = this._urlForLayer(service, layer.layerId)

        const data = await queryFeatures({
            url,
            authentication: this.authenticationProvider,
            // @ts-ignore
            f: 'geojson',
        })

        layer.populateFieldsFromFullResponse({ data })

        return data
    }
}

declare module '@ember/service' {
    interface Registry {
        arcgis: ArcGis
    }
}
