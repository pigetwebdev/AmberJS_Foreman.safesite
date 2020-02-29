import Component from '@ember/component'
import { classNames } from '@ember-decorators/component'
import { inject as service } from '@ember-decorators/service'
import { computed, action } from '@ember-decorators/object'
import Timeline from 'cloudscape/pods/timeline/service'
import { DateTime } from 'luxon'

@classNames('h-screen shadow-lg border-r border-grey')
export default class ProjectMapOverview extends Component {
    @service timeline!: Timeline

    currentUsers!: any[]

    @computed('timeline.currentTime')
    get currentTime() {
        return DateTime.fromMillis(this.timeline.currentTime)
    }

    @action
    updateStartTime(date: string) {
        const newDate = DateTime.fromFormat(date, 'yyyy-MM-dd').startOf('day')
        this.timeline.updateCurrentTime(newDate.toMillis())
        this.timeline.updateTimeRange(newDate, this.timeline.endTime)
    }

    @action
    updateEndTime(date: string) {
        const newDate = DateTime.fromFormat(date, 'yyyy-MM-dd').endOf('day')
        this.timeline.updateTimeRange(this.timeline.startTime, newDate)
    }
}
