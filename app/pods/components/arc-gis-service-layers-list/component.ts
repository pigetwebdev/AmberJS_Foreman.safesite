import Component from '@ember/component'
import { classNames, tagName } from '@ember-decorators/component'
import { ArcGisServiceObject } from 'cloudscape/pods/arc-gis/objects/service'

@tagName('ul')
@classNames('list-reset')
export default class ArcGisServiceLayersList extends Component {
    service!: ArcGisServiceObject
}
