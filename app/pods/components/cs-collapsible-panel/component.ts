import Component from '@ember/component'
import { action } from '@ember-decorators/object'
import { set } from '@ember/object'
import { tagName } from '@ember-decorators/component'

@tagName('')
export default class CsCollapsiblePanel extends Component {
    isExpanded = false
    onPanelToggle?: Function
    onPanelOpen?: Function
    onPanelClose?: Function

    @action
    toggleVisibility() {
        set(this, 'isExpanded', !this.isExpanded)

        if (this.onPanelToggle) {
            this.onPanelToggle()
        }

        if (this.onPanelOpen && this.isExpanded) {
            this.onPanelOpen()
        }

        if (this.onPanelClose && !this.isExpanded) {
            this.onPanelClose()
        }
    }
}
