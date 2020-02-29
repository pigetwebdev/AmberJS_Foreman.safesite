import Service from '@ember/service'
import { set, setProperties } from '@ember/object'
import { computed, observes } from '@ember-decorators/object'
import ENV from 'cloudscape/config/environment'
import { DateTime, Duration } from 'luxon'
import { debounce, later, cancel } from '@ember/runloop'
import { inRange, omit, without, unionBy } from 'lodash-es'
import Project from 'cloudscape/pods/project/model'
import { inject as service } from '@ember-decorators/service'
import DS from 'ember-data'
import Session from 'cloudscape/pods/session/service'
import { EmberRunTimer } from '@ember/runloop/types'

const CURRENT_TIMEOUT_MS = 20 * 60 * 1000

export default class Timeline extends Service {
    @service store!: DS.Store
    @service session!: Session

    currentTime: number = DateTime.local()
        .startOf('day')
        .toMillis()

    lastTime?: number
    rafId?: number
    project!: Project
    isPlaying = false

    isLive = false

    refreshTimer?: EmberRunTimer

    startTime: DateTime = DateTime.local().startOf('day')
    endTime: DateTime = DateTime.local()
        .endOf('day')
        .plus(1)

    animationSpeedMultiplier = 100
    granularity = 180

    positions: any[] = []
    activeUsers: any[] = []
    ignoredUserIds: string[] = []

    play(exitLiveMode = true) {
        if (exitLiveMode) {
            this.exitLiveMode()
        }

        if (this.rafId) {
            set(this, 'isPlaying', false)
            return this.stop()
        }

        set(this, 'isPlaying', true)
        this._startTickTime()
    }

    stop() {
        this.exitLiveMode()
        if (this.rafId) {
            set(this, 'isPlaying', false)
            cancelAnimationFrame(this.rafId)
            set(this, 'lastTime', undefined)
            set(this, 'rafId', undefined)
        }
    }

    _tickTime() {
        if (this.lastTime === undefined) {
            set(this, 'lastTime', new Date().getTime())
        }

        const timeNow = new Date().getTime()
        // @ts-ignore
        const elapsed = (timeNow - this.lastTime) * this.animationSpeedMultiplier

        if (elapsed >= 1000) {
            set(this, 'lastTime', timeNow)
            if (
                this.currentTime + elapsed >= this.endTime.toMillis() ||
                this.currentTime + elapsed < this.startTime.toMillis()
            ) {
                this.stop()
                return
            } else {
                set(this, 'currentTime', this.currentTime + elapsed)
            }
        }

        set(this, 'rafId', undefined)

        return this._startTickTime()
    }

    _startTickTime() {
        if (this.rafId === undefined) {
            this.rafId = requestAnimationFrame(this._tickTime.bind(this))
        }
    }

    updateTimeRange(startTime: DateTime, endTime: DateTime, exitLiveMode = true) {
        if (exitLiveMode) {
            this.exitLiveMode()
        }

        // get duration, set granularity

        const duration = endTime.toMillis() - startTime.toMillis()
        const ONE_DAY = 86400000
        const ONE_HOUR = 60000

        let granularity

        switch (true) {
            case duration > ONE_DAY:
                granularity = 300
                break
            case duration <= ONE_HOUR * 6:
                granularity = 10
                break
            case duration <= ONE_DAY:
                granularity = 30
                break
            default:
                granularity = 180
                break
        }

        let currentTime = this.currentTime
        let lastTime = this.lastTime

        if (startTime.toMillis() > this.currentTime || endTime.toMillis() < this.currentTime) {
            currentTime = startTime.toMillis()
            lastTime = lastTime ? currentTime : undefined
        }

        setProperties(this, { startTime, endTime, granularity, currentTime, lastTime })
    }

    updateCurrentTime(currentTime: number, exitLiveMode = true) {
        if (exitLiveMode) {
            this.exitLiveMode()
        }

        set(this, 'currentTime', currentTime)
    }

    goLive() {
        const startTime = DateTime.local()
            .startOf('day')
            .toUTC()
        const endTime = DateTime.local()
            .endOf('day')
            .plus(1)
            .toUTC()

        this.updateTimeRange(startTime, endTime, false)

        set(this, 'isLive', true)
        set(this, 'granularity', 10)
        set(this, 'animationSpeedMultiplier', 1)

        this.updateCurrentTime(
            DateTime.local()
                .toUTC()
                .minus(Duration.fromMillis(120 * 1000))
                .toMillis(),
            false,
        )

        this.play(false)
        this.createRefreshTimer()

        // set startTime to now minue granularity,
        // set current time to now, set multiplier to 1x,
        // set end time to 1 day from now
        // create new timer which reloads data every 30second
    }

    exitLiveMode() {
        if (this.isLive) {
            set(this, 'granularity', 180)
            set(this, 'animationSpeedMultiplier', 100)
            set(this, 'isLive', false)

            this.stop()
            this.cancelRefreshTimer()
        }
    }

    createRefreshTimer() {
        this.refreshTimer = later(
            this,
            () => {
                this._loadPositionEvents()
                this.createRefreshTimer()
            },
            15000,
        )
    }

    cancelRefreshTimer(): boolean {
        if (this.refreshTimer) {
            cancel(this.refreshTimer)
            set(this, 'refreshTimer', undefined)
            return true
        } else {
            return true
        }
    }

    toggleVisibility(userId: string) {
        if (this.ignoredUserIds.includes(userId)) {
            this.ignoredUserIds.removeObject(userId)
        } else {
            this.ignoredUserIds.pushObject(userId)
        }
    }

    @computed('currentTime', 'positions.[]')
    get currentEvents() {
        // get current live events,
        // and then also get idle events
        // i.e: something which has been seen in x amount of time,
        // add a bool to the latter and merge.

        const positions = this.positions

        const activeEvents = positions
            .filter(position => inRange(this.currentTime, position.from, position.til))
            .map(position => {
                return { status: 'active', ...position }
            })

        const idleEvents = positions
            .filter(
                position =>
                    inRange(this.currentTime, position.from, position.til + CURRENT_TIMEOUT_MS) &&
                    !activeEvents.any(ae => ae.eventId === position.eventId),
            )
            .map(position => {
                return { status: 'idle', lastSeen: position.from, ...position }
            })

        return unionBy(activeEvents, idleEvents, 'userId')
    }

    @computed('activeUsers')
    get currentUsers() {
        const activeUserIds = this.activeUsers.map((u: any) => u.user_id)

        if (activeUserIds.length === 0) {
            return []
        }

        return this.store.query('user', {
            filter: { ids: activeUserIds },
        })
    }

    @computed('currentEvents.[]', 'activeUsers.[]')
    get currentPositionsAsGeoJSON() {
        let features = []

        if (this.store.peekAll('user').length !== 0) {
            features = this.currentEvents.reduce((acc, currentValue) => {
                return Array.prototype.concat(acc, this.geoJSONFeatureFromPosition(currentValue))
            }, [])
        }

        return {
            type: 'FeatureCollection',
            features,
        }
    }

    geoJSONFeatureFromPosition(position: any) {
        const properties = omit(position, 'latitude', 'longitude', 'eventId')

        let { roleName, name } = position

        return {
            id: parseInt(`${position.eventId}`),
            type: 'Feature',
            properties: {
                ...properties,
                name,
                userId: position.userId,
                iconName: this.iconNameFromUserRole(roleName),
            },
            geometry: {
                type: 'Point',
                coordinates: [position.longitude, position.latitude],
            },
        }
    }

    iconNameFromUserRole(role: string) {
        switch (role.toLowerCase()) {
            case 'engineer':
                return 'helmet-engineer'
            case 'labourer':
                return 'helmet-labourer'
            case 'environment':
                return 'helmet-environment'
            case 'community':
                return 'helmet-community'
            case 'surveyor':
                return 'helmet-surveyor'
            case 'other':
                return 'helmet-other'
            case 'safety':
                return 'helmet-safety'
            case 'foreman':
                return 'helmet-foreman'
            case 'excavator':
                return 'trucking-22'
            case 'backhoe':
                return 'trucking-27'
            case 'truck':
            case 'bogie tipper':
            case 'boral truck':
                return 'trucking-9'
            case 'compactor':
                return 'trucking-24'
            case 'concrete truck':
                return 'trucking-8'
            case 'crane':
                return 'trucking-45'
            case 'dozer':
                return 'trucking-18'
            case 'grader':
                return 'trucking'
            case 'paver':
                return 'trucking-36'
            case 'scraper':
                return 'trucking-7'
            case 'site truck':
                return 'trucking-7'
            case 'skid steer':
                return 'trucking-14'
            case 'water cart':
                return 'trucking-1'
            case 'light vehicle':
                return 'pickup-truck'
            default:
                return 'helmet-other'
        }
    }

    @observes('startTime', 'endTime')
    loadActiveUsers() {
        debounce(this, this._loadActiveUsers, 300)
    }

    async _loadActiveUsers() {
        try {
            const activeUsers = await fetch(
                `${
                    ENV.APP.apiUrl
                }/v7/timeline-events/active-users?start=${this.startTime.toUTC()}&end=${this.endTime.toUTC()}&projectId=${
                    this.project.id
                }`,
                {
                    headers: {
                        Authorization: `Bearer ${this.session.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            ).then(r => r.json())

            set(this, 'activeUsers', activeUsers)
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    @observes('activeUsers.@each.user_id', 'granularity', 'ignoredUserIds.[]')
    loadPositionEvents() {
        debounce(this, this._loadPositionEvents, 300)
    }

    async _loadPositionEvents(
        startTime = this.startTime.toUTC(),
        endTime = this.endTime.toUTC(),
        granularity = this.granularity,
    ) {
        if (this.activeUsers.length === 0) {
            return
        }

        let userIds = this.activeUsers.map(u => u.user_id)
        userIds = without(userIds, ...this.ignoredUserIds)

        if (userIds.length === 0) {
            set(this, 'positions', [])
            return
        }

        const userIdParams = userIds.length > 0 ? userIds.map(u => `&userIds[]=${u}`).join('') : ''

        try {
            const positions = await fetch(
                `${
                    ENV.APP.apiUrl
                }/v7/timeline-events/positions?start=${startTime}&end=${endTime}&granularity=${granularity}&projectId=${
                    this.project.id
                }${userIdParams}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.session.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            ).then(r => r.json())

            set(
                this,
                'positions',
                positions.flatMap((interval: any) => {
                    // @ts-ignore
                    return interval.data.flatMap(
                        // @ts-ignore
                        ([eventId, longitude, latitude, userId, name, roleName]) => {
                            return {
                                eventId,
                                longitude,
                                latitude,
                                userId,
                                name,
                                roleName,
                                from: interval.from,
                                til: interval.til,
                                date: DateTime.fromMillis(interval.from),
                                dateEnd: DateTime.fromMillis(interval.til),
                            }
                        },
                    )
                }),
            )
        } catch (error) {
            console.error(error)
            throw error
        }
    }
}

declare module '@ember/service' {
    interface Registry {
        timeline: Timeline
    }
}
