import Service from '@ember/service'
import Evented from '@ember/object/evented'
// @ts-ignore
import fetch from 'fetch'
import ENV from 'cloudscape/config/environment'
import Session from 'cloudscape/pods/session/service'

import { inject as service } from '@ember-decorators/service'
import { Expression } from 'mapbox-gl'
import { GeoJsonTypes } from 'geojson'
import { getWithDefault, set } from '@ember/object'

interface LayerRegistryEntry {
    projectId: number
    layers: LayerGroup[]
}

export default class LayerManager extends Service.extend(Evented) {
    /**
     * this service is responsible for querying our api and returning the layers for a project.
     * it's also responsible for updating those layers, and emitting the correct events
     * so we can draw the layers on the map correctly
     */

    @service session!: Session

    layerRegistry: Array<LayerRegistryEntry> = []

    async loadLayersFor(projectId: number) {
        const layers = await this._getLayersFor(projectId)

        this.layerRegistry.pushObject({
            projectId,
            layers,
        })

        this.trigger(`load:${projectId}`)
    }

    toggleFeatureVisibility({
        projectId,
        feature,
        layerId,
    }: {
        projectId: number
        feature: Geometry
        layerId: number
    }) {
        const {
            id: featureId,
            geometry: { type: featureType },
        } = feature

        set(feature, 'visible', !getWithDefault(feature, 'visible', true))

        //  add the featureId to the filter expression to hide the layer
        const filter = ['!=', '$id', featureId]

        const layerName = `${layerId}-${featureType.toLowerCase()}`

        const eventPayload: VisibilityChangedEventPayload = {
            projectId,
            feature,
            layerId: layerName,
            filter,
        }

        this.trigger(`toggleVisibility:${projectId}`, eventPayload)
    }

    layersFor(projectId: number): LayerGroup[] {
        const layerRegistryItem = this.layerRegistry.findBy('projectId', projectId)

        return layerRegistryItem ? layerRegistryItem.layers : []
    }

    _getLayersFor(projectId: number): Promise<LayerGroup[]> {
        return fetch(`${ENV.APP.apiUrl}/v6/projects/${projectId}/geometries/overlays`, {
            headers: {
                Authorization: `Bearer ${this.session.accessToken}`,
            },
        })
            .then((r: Response) => r.json())
            .then(this._decorateResponse)
    }

    private _decorateResponse(layerGroups: LayerGroup[]): LayerGroup[] {
        return layerGroups.map(layerGroup => {
            layerGroup.geometries.forEach(geometry => {
                geometry.visible = true
            })
            return layerGroup
        })
    }
}

declare module '@ember/service' {
    interface Registry {
        'layer-manager': LayerManager
    }
}

export interface VisibilityChangedEventPayload {
    projectId: number
    feature: Geometry
    layerId: string
    filter: Expression
}

export interface Marker {
    icon: string
    prefix: string
    iconColor: string
    markerColor: string
}

export interface Polygon {
    fill: boolean
    color: string
    weight: number
    opacity: number
    lineJoin: string
    fillColor: string
    fillOpacity: number
}

export interface Properties {
    marker: Marker
    polygon: Polygon
    isBoundary: boolean
    startChainage?: number
}

export interface Properties2 {
    name: string
    description: string
    observationType: string
    photoUrl: string
    icon: string
    prefix: string
    markerColor: string
    iconColor: string
    purpose: string
    speedLimit: string
    photoUrls: string[]
}

export interface Geometry2 {
    type: GeoJsonTypes
    coordinates: any[]
}

export interface BboxPoints {
    type: string
    coordinates: number[][][]
}

export interface Geometry {
    id: number
    visible: boolean
    type: GeoJsonTypes
    properties: Properties2
    geometry: Geometry2
    bboxPoints: BboxPoints
    createdAt: string
    createdBy: string
}

export interface LayerGroup {
    id: number
    name: string
    properties: Properties
    displayOrder: number
    geometries: Geometry[]
    mutable?: boolean
}
