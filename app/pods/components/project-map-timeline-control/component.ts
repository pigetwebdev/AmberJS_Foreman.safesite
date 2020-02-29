import Component from '@ember/component'
import { inject as service } from '@ember-decorators/service'
import { action, computed } from '@ember-decorators/object'
import { DateTime } from 'luxon'

import Timeline from 'cloudscape/pods/timeline/service'
import { classNames } from '@ember-decorators/component'
import { set } from '@ember/object'

@classNames('px-3')
export default class ProjectMapTimelineControl extends Component {
    @service timeline!: Timeline

    constructor() {
        super(...arguments)

        setTimeout(() => {
            this.timeline.goLive()
        }, 100)
    }

    @action
    play() {
        if (this.timeline.isPlaying) {
            this.timeline.stop()
        } else {
            this.timeline.play()
        }
    }

    @computed('timeline.currentTime')
    get currentTime() {
        return DateTime.fromMillis(this.timeline.currentTime)
    }

    @action
    seekForward() {
        const { currentTime, granularity } = this.timeline
        this.timeline.exitLiveMode()
        set(this.timeline, 'currentTime', currentTime + granularity * 1000)
    }

    @action
    seekBackward() {
        const { currentTime, granularity } = this.timeline
        this.timeline.exitLiveMode()
        set(this.timeline, 'currentTime', currentTime - granularity * 1000)
    }

    @action
    goLive() {
        this.timeline.goLive()
    }
}
