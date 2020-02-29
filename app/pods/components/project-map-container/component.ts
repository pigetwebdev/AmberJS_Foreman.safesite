import Component from '@ember/component'
import { MapboxEvent, MapMouseEvent } from 'mapbox-gl'
import { inject as service } from '@ember-decorators/service'
import { observes } from '@ember-decorators/object'
import Maps from 'cloudscape/pods/maps/service'
import LayerManager, { VisibilityChangedEventPayload } from 'cloudscape/pods/layer-manager/service'
import Project from 'cloudscape/pods/project/model'

import { dropTask } from 'ember-concurrency-decorators'
// @ts-ignore
import { waitForEvent } from 'ember-concurrency'
import Timeline from 'cloudscape/pods/timeline/service'
import { oneWay } from '@ember-decorators/object/computed'
import { set } from '@ember/object'

export default class ProjectMapContainer extends Component {
    project!: Project

    @service maps!: Maps
    @service layerManager!: LayerManager
    @service timeline!: Timeline

    @oneWay('timeline.currentPositionsAsGeoJSON') currentPositions!: any[]
    @oneWay('timeline.currentUsers') currentUsers!: any[]
    mapName = 'project-map'

    willInsertElement() {
        this._setupMapListeners()
        this._setupSubscriptions()

        return super.willInsertElement()
    }

    async _setupSubscriptions() {
        const { id: projectId } = this.project

        set(this.timeline, 'project', this.project)
        await this.timeline._loadActiveUsers()

        // users are loaded, have them set as visible by default at the component level
        await this.timeline._loadPositionEvents()

        // @ts-ignore
        this.layerManager.loadLayersFor(projectId)

        this.layerManager.one(`load:${projectId}`, this, () => {
            // @ts-ignore
            this._drawLayers.perform()
        })

        this.layerManager.on(
            `toggleVisibility:${projectId}`,
            this,
            (payload: VisibilityChangedEventPayload) => {
                this.maps.toggleVisibilityFor(this.mapName, payload)
            },
        )

        this.positionsHaveChanged()
    }

    _setupMapListeners() {
        this.maps.one(`load:${this.mapName}`, this, (event: MapboxEvent) => {
            const { target: mapInstance } = event
            // @ts-ignore
            mapInstance.fitBounds(this.project.mapBounds)
        })

        this.maps.on(`click:${this.mapName}`, this, (event: MapMouseEvent) => {
            const { target: mapInstance } = event
        })
    }

    @observes('currentPositions.[]')
    positionsHaveChanged() {
        this._drawPositions.perform()
    }

    @dropTask
    *_drawPositions() {
        const mapReady = this.maps.isMapLoaded(this.mapName)
        const positions = this.timeline.currentPositionsAsGeoJSON

        if (!mapReady) {
            console.debug(`positions - ${this.mapName} isn't loaded yet`)
            yield waitForEvent(this.maps, `load:${this.mapName}`)
            console.debug(`positions - ${this.mapName} has arrived`)
        }

        try {
            const dataSourceName = `${this.project.id}-positions`
            const dataSourceExists = this.maps.getDataSource(this.mapName, dataSourceName)

            if (!dataSourceExists) {
                this.maps.addDataSource(this.mapName, dataSourceName, {
                    type: 'geojson',
                    data: positions,
                    cluster: true,
                    clusterMaxZoom: 16, // Max zoom to cluster points on
                    clusterRadius: 32,
                })

                yield this.maps.addPositionTrackingLayer(
                    this.mapName,
                    `${this.project.id}-positions`,
                )
            } else {
                this.maps.setDataForGeoJSONSource(this.mapName, dataSourceName, positions)
            }
        } catch (error) {
            console.error(error)
        }
    }

    @dropTask
    *_drawLayers() {
        // @ts-ignore
        const layerGroups = this.layerManager.layersFor(this.project.id)

        const mapReady = this.maps.isMapLoaded(this.mapName)

        if (!mapReady) {
            console.debug(`layers - ${this.mapName} isn't loaded yet`)
            yield waitForEvent(this.maps, `load:${this.mapName}`)
            console.debug(`layers - ${this.mapName} has arrived`)
        }

        layerGroups.forEach(group => {
            const features = group.geometries

            // add data source
            this.maps.addDataSource('project-map', group.id, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features,
                },
            })

            this.maps.addGeoJsonLayer('project-map', group.id)
        })

        yield (() => {
            return true
        })()
    }
}
