import Component from '@ember/component'
import d3, { easeCubicInOut, transition } from 'd3'
import { computed, observes, action } from '@ember-decorators/object'
import { inject as service } from '@ember-decorators/service'
import { oneWay } from '@ember-decorators/object/computed'
import { set } from '@ember/object'
import Timeline from 'cloudscape/pods/timeline/service'
import { DateTime, Duration } from 'luxon'
import { classNames } from '@ember-decorators/component'
import { debounce } from '@ember/runloop'

@classNames('flex')
export default class ProjectMapTimelineSwimlane extends Component {
    @service timeline!: Timeline
    @oneWay('timeline.currentTime') currentTime!: number
    @oneWay('timeline.startTime') startTime!: DateTime
    @oneWay('timeline.endTime') endTime!: DateTime

    recentStartTimes: DateTime[] = []
    recentEndTimes: DateTime[] = []

    chart!: d3.Selection<d3.BaseType, any, any, any>
    chartAxis!: d3.Selection<d3.BaseType, any, any, any>
    brush!: d3.BrushBehavior<{}>

    isBrushDoubleClick: boolean = false

    @computed('startTime', 'endTime')
    get timeScale() {
        // @ts-ignore
        const { width } = this.element.querySelector('svg.chart').getBoundingClientRect()
        console.debug('width to use for time scale: %i', width)
        return d3
            .scaleTime()
            .domain([this.startTime.toJSDate(), this.endTime.toJSDate()])
            .range([0, width])
    }

    @observes('timeScale')
    timeScaleHasChanged() {
        this.updateBottomAxis()
        this.updateCurrentTimeLine()
    }

    @observes('timeline.positions')
    loadedPositionsChanged() {
        this.drawPositions()
    }

    @observes('currentTime')
    currentTimeHasChanged() {
        this.updateCurrentTimeLine()
    }

    connectTimeSlider() {
        // @ts-ignore
        const { height } = this.element.querySelector('svg.chart').getBoundingClientRect()

        const drag = d3.drag().on('start', () => {
            console.log('drag start')
        })

        this.chart
            .select('line.current-time')
            .attr('x1', this.timeScale(this.currentTime))
            .attr('y1', 0)
            .attr('x2', this.timeScale(this.currentTime))
            .attr('y2', height)
            .attr('stroke', 'red')
            .call(drag)
    }

    drawPositions() {
        let t = transition()
            .duration(250)
            .ease(easeCubicInOut)

        const positions = this.chart
            .select('g.position-events')
            .selectAll('rect')
            .data(this.timeline.positions, p => p.eventId)

        positions
            .exit()
            .transition(t)
            .attr('width', 0)
            .remove()

        let enterJoin = positions
            .enter()
            .append('rect')
            .attr('y', '20')
            .attr('height', 5)
            .attr('stroke', 'none')
            .attr('fill', 'lightblue')
            .attr('opacity', 0)

        enterJoin
            // @ts-ignore
            .merge(positions)
            .attr('x', (d: any) => this.timeScale(d.date))
            .attr('width', (d: any) => this.timeScale(d.dateEnd) - this.timeScale(d.date))
            .transition(t)
            .attr('opacity', 1)
    }

    didInsertElement() {
        const element = this.element as HTMLElement

        // @ts-ignore
        const { height, width } = element.querySelector('svg.chart').getBoundingClientRect()

        const chart = d3.select(element).select('svg.chart')
        const chartAxis = d3.select(element).select('svg.chart-axis')

        set(this, 'chart', chart)
        set(this, 'chartAxis', chartAxis)

        const brush = d3
            .brushX()
            .extent([[0, 0], [width, height]])
            .on('end', this.handleBrushEnd.bind(this))

        chart
            .append('g')
            .attr('class', 'brush-element')
            .call(brush)

        set(this, 'brush', brush)

        chart.on('click', () => {
            // @ts-ignore
            const [x, y] = d3.mouse(element.querySelector('svg.chart'))

            const newTime = this.timeScale.invert(x).getTime()
            this.timeline.updateCurrentTime(newTime)
        })

        // Handle the mouse wheel zoom, we should add limits on how far we can zoom in our out. max zoom out is 1 month

        // @ts-ignore
        chart.on('wheel', () => {
            const event = d3.event
            debounce(
                this,
                () => {
                    const { deltaY, layerX } = event as WheelEvent
                    const centerPoint = this.timeScale.invert(layerX)

                    const [start, end] = this.timeScale.domain()

                    const duration = end.getTime() - start.getTime()

                    const zoomingIn = Math.sign(deltaY) !== 1

                    const step = duration / 6

                    if (
                        (duration >= 2629800000 && !zoomingIn) ||
                        (duration <= 3600000 && zoomingIn)
                    ) {
                        console.log('not zooming any further %i', duration)
                        return false
                    }

                    if (zoomingIn) {
                        const zoomBaseEnd = centerPoint.getTime() + duration / 2
                        const zoomBaseStart = centerPoint.getTime() - duration / 2
                        const newStart = DateTime.fromMillis(zoomBaseStart + step)
                        const newEnd = DateTime.fromMillis(zoomBaseEnd - step)

                        this.timeline.updateTimeRange(newStart, newEnd)
                    } else {
                        const zoomBaseEnd = centerPoint.getTime() + duration / 2
                        const zoomBaseStart = centerPoint.getTime() - duration / 2
                        const newStart = DateTime.fromMillis(zoomBaseStart - step)
                        const newEnd = DateTime.fromMillis(zoomBaseEnd + step)

                        this.timeline.updateTimeRange(newStart, newEnd)
                    }
                },
                750,
            )
        })

        this.connectTimeSlider()
        this.connectBottomAxis()
    }

    handleBrushEnd() {
        const { selection, sourceEvent } = d3.event

        //  This is triggered by the brush.move call
        if (sourceEvent.sourceEvent) {
            return
        }

        if (!selection) {
            if (this.isBrushDoubleClick) {
                this.zoomOutToLastTimeRange()
            } else {
                setTimeout(() => {
                    set(this, 'isBrushDoubleClick', false)
                }, 500)

                set(this, 'isBrushDoubleClick', true)
            }
        } else {
            const selectionStart = DateTime.fromJSDate(this.timeScale.invert(selection[0]))
            const selectionEnd = DateTime.fromJSDate(this.timeScale.invert(selection[1]))

            const duration = selectionEnd.toMillis() - selectionStart.toMillis()

            if (duration >= 2629800000 || duration <= 3600000) {
                console.log('not zooming any further %i', duration)
                this.chart.select('g.brush-element').call(this.brush.move, null)
                return false
            }

            this.recentStartTimes.pushObject(this.startTime)
            this.recentEndTimes.pushObject(this.endTime)

            this.timeline.updateTimeRange(selectionStart, selectionEnd)
            // deselect the brush
            this.chart.select('g.brush-element').call(this.brush.move, null)
        }
    }

    zoomOutToLastTimeRange() {
        if (this.recentStartTimes.length === 0) {
            return
        }

        const lastStart = this.recentStartTimes.popObject()
        const lastEnd = this.recentEndTimes.popObject()

        this.timeline.updateTimeRange(lastStart, lastEnd)
    }

    connectBottomAxis() {
        const bottomAxis = d3.axisBottom(this.timeScale)

        // @ts-ignore
        const { height, width } = this.element
            .querySelector('svg.chart-axis')
            .getBoundingClientRect()

        this.chartAxis
            .append('g')
            .attr('class', 'bottom-axis')
            .attr('width', width)
            .call(bottomAxis)
    }

    updateCurrentTimeLine() {
        this.chart
            .select('line.current-time')
            .attr('x1', this.timeScale(this.currentTime))
            .attr('x2', this.timeScale(this.currentTime))
    }

    updateBottomAxis() {
        const bottomAxis = d3.axisBottom(this.timeScale)
        this.chartAxis
            .select('g.bottom-axis')
            .transition()
            // @ts-ignore
            .call(bottomAxis)
    }

    @action
    nextTimeRange() {
        this._shiftTimeRangeByMillis(this._getCurrentDuration())
    }

    @action
    previousTimeRange() {
        this._shiftTimeRangeByMillis(this._getCurrentDuration() * -1)
    }

    _getCurrentDuration(): number {
        const { startTime, endTime } = this.timeline

        return endTime.toMillis() - startTime.toMillis()
    }

    _shiftTimeRangeByMillis(millis: number) {
        const { startTime, endTime } = this.timeline
        const duration = Duration.fromMillis(millis)
        this.timeline.updateTimeRange(startTime.plus(duration), endTime.plus(duration))
    }
}
