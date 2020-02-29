import Component from '@ember/component'
import { action } from '@ember-decorators/object'
import { className } from '@ember-decorators/component'

export default class CsCollapsiblePanelTitle extends Component {
    @className('expanded') isExpanded!: boolean

    @action
    toggle() {
        this.onToggle()
    }
}
