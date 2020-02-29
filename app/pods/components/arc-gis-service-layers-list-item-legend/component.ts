import Component from '@ember/component'
import { classNames, tagName } from '@ember-decorators/component'
import { ArcGisServiceObject } from 'cloudscape/pods/arc-gis/objects/service'

@tagName('ul')
@classNames('list-reset mx-2 my-2')
export default class ArcGisServerLayersListItemLegend extends Component {
    service!: ArcGisServiceObject
}
