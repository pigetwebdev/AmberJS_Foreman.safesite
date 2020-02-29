import { setProperties } from '@ember/object'
import { inject as service } from '@ember-decorators/service'
import ArcGis from 'cloudscape/pods/arc-gis/service'

class ArcGisServiceLayer {
    @service arcGis!: ArcGis

    visible = false
    _fullObject = false
    data: any
    actions: any

    constructor(params: any) {
        // @ts-ignore
        Object.assign(this, params)
    }

    populateFieldsFromFullResponse(data: any): void {
        // @ts-ignore
        setProperties(this, Object.assign(data, { _fullObject: true }))
    }
}

export { ArcGisServiceLayer }
