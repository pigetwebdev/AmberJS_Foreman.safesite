import Component from '@ember/component'
import { className, classNames, tagName } from '@ember-decorators/component'
import { action, computed } from '@ember-decorators/object'
import { inject as service } from '@ember-decorators/service'

import { oneWay } from '@ember-decorators/object/computed'
import Project from 'cloudscape/pods/project/model'
import Timeline from 'cloudscape/pods/timeline/service'

@tagName('li')
@classNames('flex items-center px-3 py-4 border mb-2 border-l-4 rounded-sm')
export default class ProjectMapUsersListItem extends Component {
    user!: any
    project!: Project
    @service timeline!: Timeline

    @computed('user.roleName')
    get userIconName() {
        let { name, roleName } = this.user

        if (/^LV/.test(name)) {
            roleName = 'light vehicle'
        }

        return `#${this.timeline.iconNameFromUserRole(roleName)}`
    }

    @className('selected')
    @oneWay('user.isSelected')
    isSelected!: boolean

    click(event: Event) {
        const { shiftKey } = event
        // this.selectionChanged(shiftKey)
    }

    @action
    toggleVisibility() {
        this.timeline.toggleVisibility(this.user.id)
    }

    @computed('timeline.ignoredUserIds.[]')
    get hiddenFromMap() {
        return this.timeline.ignoredUserIds.includes(this.user.id)
    }

    @className
    @computed('timeline.currentTime', 'user.id')
    get mapStatus() {
        const currentEvents = this.timeline.currentEvents
        // return 'active' or 'gone' - idle to be added later by someone other than me
        const user = currentEvents.findBy('userId', this.user.id)

        return user ? user.status : 'gone'
    }
}
