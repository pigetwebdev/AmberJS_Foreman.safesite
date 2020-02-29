import Component from '@ember/component'
import { inject as service } from '@ember-decorators/service'
import ArcGis, { ArcGisService } from 'cloudscape/pods/arc-gis/service'
import Maps from 'cloudscape/pods/maps/service'
import { action } from '@ember-decorators/object'
import { reads } from '@ember-decorators/object/computed'
import { dropTask } from 'ember-concurrency-decorators'

export default class ArcGisServiceList extends Component {
    @service arcGis!: ArcGis
    @service maps!: Maps
    folder!: string

    @reads('arcGis._serviceRegistry') availableServices: any;

    @dropTask
    *loadArcGISServices() {
        yield this.arcGis.loadServicesForFolder(this.folder)
    }

    @action
    async loadServices(this: ArcGisServiceList) {
        // @ts-ignore
        this.loadArcGISServices.perform()
    }
}
