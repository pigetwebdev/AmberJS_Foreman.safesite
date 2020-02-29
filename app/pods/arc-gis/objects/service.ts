import { computed } from '@ember-decorators/object'
import { setProperties } from '@ember/object'
import { ArcGisServiceLayer } from 'cloudscape/pods/arc-gis/objects/layer'

type ServiceType = 'ImageServer' | 'FeatureServer' | 'MapServer'

class ArcGisServiceObject implements IArcGisServiceResponse {
    name!: string
    type!: ServiceType
    visible: boolean = false
    layers: ArcGisServiceLayer[] = []

    units!: string

    _fullObject: boolean = false
    // we only build these from the shallow responses
    constructor(params: IArcGisServiceResponse) {
        Object.assign(this, params)
    }

    populateFieldsFromFullResponse(data: any): void {
        const layers = data.layers.map((l: any) => new ArcGisServiceLayer(l))

        setProperties(this, Object.assign(data, { layers }, { _fullObject: true }))
    }

    @computed('name')
    get prettyName() {
        return this.name.replace(/^[\w]+\//, '')
    }
}

export { ArcGisServiceObject }

interface IArcGisServiceResponse {
    name: string
    type: ServiceType
}
