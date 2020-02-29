import Component from '@ember/component'
import { classNames, tagName } from '@ember-decorators/component'
import { ArcGisServiceLayer } from 'cloudscape/pods/arc-gis/objects/layer'
import { inject as service } from '@ember-decorators/service'
import { dropTask } from 'ember-concurrency-decorators'
import ArcGis from 'cloudscape/pods/arc-gis/service'
import { ArcGisServiceObject } from 'cloudscape/pods/arc-gis/objects/service'

@tagName('li')
@classNames('mx-6 px-4 py-2 mb-2')
export default class ArcGisServiceLayersListItem extends Component {
    @service arcGis!: ArcGis

    layer!: ArcGisServiceLayer
    service!: ArcGisServiceObject;

    @dropTask
    *toggleTask() {
        // @ts-ignore
        yield this.arcGis.toggleLayerVisibility.perform(this.service, this.layer)
    }
}
