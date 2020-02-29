import Component from '@ember/component'
// @ts-ignore
import { set } from '@ember/object'
import User from 'cloudscape/pods/user/model'
import Session from 'cloudscape/pods/session/service'
import Project from 'cloudscape/pods/project/model'
import { inject as service } from '@ember-decorators/service'
import { action, computed } from '@ember-decorators/object'
import { filterBy, oneWay } from '@ember-decorators/object/computed'
// @ts-ignore
import { timeout } from 'ember-concurrency'

import { groupBy, take } from 'lodash-es'
import Timeline from 'cloudscape/pods/timeline/service'
import { DS } from 'ember-data'

export default class ProjectMapUsersList extends Component {
    @service session!: Session
    @service timeline!: Timeline
    @service store!: DS.Store
    @oneWay('timeline.currentUsers') users!: User[]

    project!: Project
    groupByRole: boolean = true

    lastClickTrackingObject: { [index: string]: number } = {}

    willInsertElement() {
        console.log(this.users)
    }

    @computed('timeline.currentUsers.[]')
    get usersGroupedByRole() {
        return groupBy(this.users, 'roleName')
    }

    @computed('users.@each.isSelected')
    get usersSelected() {
        return this.users.any(u => u.isSelected)
    }

    @filterBy('users', 'isSelected', true) selectedUsers!: User[]

    @action
    handleUserSelection(user: any, index: number, shiftKeyPressed = false) {
        const { role: userRole } = user
        const lastIndex = this.lastClickTrackingObject[userRole]

        console.log(`shift key pressed ${shiftKeyPressed}`)
        console.log(`last index ${lastIndex}`)
        console.log(`current index ${index}`)
        console.log('-------------------------')

        if (shiftKeyPressed && lastIndex !== undefined) {
            const count = index > lastIndex ? index - lastIndex : lastIndex - index

            console.log(`must select from ${lastIndex} until ${index} (${count})`)

            const users: User[] = take(
                this.usersGroupedByRole[userRole].filter((_, index) => index > lastIndex),
                count,
            )

            //@ts-ignore
            users.forEach(user => set(user, 'isSelected', true))

            console.log(users)
            // const users = direction === 'forward' ? this.usersGroupedByRole[userRole] : reverse(this.usersGroupedByRole[userRole])

            // console.log(users)
            //
            // while () {}

            // set(user, 'isSelected', true)
        } else {
            set(user, 'isSelected', !user.isSelected)
        }

        this.lastClickTrackingObject[user.roleName] = index
    }

    @action
    hideUsersOnMap(roleName?: string) {
        let users = this.users

        if (this.usersSelected) {
            users = users.filterBy('isSelected')
        }

        if (roleName) {
            users = users.filterBy('roleName', roleName)
        }

        const userIds = users.mapBy('id')

        this.timeline.ignoredUserIds.pushObjects(userIds)
    }

    @action
    showUsersOnMap(roleName?: string) {
        let users = this.users

        if (this.usersSelected) {
            users = users.filterBy('isSelected')
        }

        if (roleName) {
            users = users.filterBy('roleName', roleName)
        }

        const userIds = users.mapBy('id')

        this.timeline.ignoredUserIds.removeObjects(userIds)
    }

    @action
    deselectUsers(roleName?: string) {
        const users = roleName ? this.users.filterBy('roleName', roleName) : this.users
        users.forEach(u => set(u, 'isSelected', false))
    }
}
