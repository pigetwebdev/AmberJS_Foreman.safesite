import Component from '@ember/component'
import { className, classNames, tagName } from '@ember-decorators/component'
import { action } from '@ember-decorators/object'
import { inject as service } from '@ember-decorators/service'
import { dropTask } from 'ember-concurrency-decorators'

import ArcGis from 'cloudscape/pods/arc-gis/service'
import { ArcGisServiceObject } from 'cloudscape/pods/arc-gis/objects/service'

@tagName('li')
@classNames('border-b pb-2')
export default class ArcGisServiceListItem extends Component {
    @service arcGis!: ArcGis
    service!: ArcGisServiceObject

    @className('expanded') isExpanded = false;

    @dropTask
    *loadServiceLayers() {
        yield this.arcGis.loadLayersForService(this.service)
    }

    @dropTask
    *toggleImageServiceVisibilityTask() {
        //@ts-ignore
        yield this.arcGis.toggleLayerVisibility.perform(this.service)
    }

    @action
    loadExtendedData() {
        //@ts-ignore
        this.loadServiceLayers.perform()
    }
}
