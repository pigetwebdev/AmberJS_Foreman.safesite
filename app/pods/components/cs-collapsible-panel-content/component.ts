import Component from '@ember/component'
import { className } from '@ember-decorators/component'

export default class CsCollapsiblePanelContent extends Component {
    @className('expanded') isExpanded!: boolean
}
