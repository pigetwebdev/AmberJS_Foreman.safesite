import Service from '@ember/service'
import mapboxgl, {
    Expression,
    Map,
    MapboxEvent,
    MapboxOptions,
    MapDataEvent,
    VectorSource,
    RasterSource,
    RasterDemSource,
    GeoJSONSource,
    ImageSource,
    VideoSource,
} from 'mapbox-gl'

import ENV from 'cloudscape/config/environment'
import Evented from '@ember/object/evented'
import { VisibilityChangedEventPayload } from 'cloudscape/pods/layer-manager/service'
import { GeoJsonGeometryTypes } from 'geojson'
import { ArcGisServiceLayer } from 'cloudscape/pods/arc-gis/objects/layer'
import { loadImageIntoMapInstance } from 'cloudscape/pods/arc-gis/utils/mapbox-utils'
// @ts-ignore
import { ADD_IMAGE, ADD_LAYER } from 'arcgis-mapbox-utils/lib/utils/constants'
import { set } from '@ember/object'
import config from 'cloudscape/config/environment'

interface MapRegistryLayersItem {
    filters: Expression
}

interface MapRegistryItem {
    name: string
    mapInstance: Map | undefined
    layers: { [id: string]: MapRegistryLayersItem }
    arcGisLayers: { [id: string]: string[] }
    mapLoaded: boolean
}

export default class Maps extends Service.extend(Evented) {
    init() {
        super.init()
        // @ts-ignore
        mapboxgl.accessToken = ENV['mapbox-gl'].accessToken
    }

    defaultFiltersForTypes: { [index in GeoJsonGeometryTypes]: Expression } = {
        Polygon: ['all', ['==', '$type', 'Polygon']],
        LineString: ['all', ['==', '$type', 'LineString']],
        Point: ['all', ['==', '$type', 'Point']],
        MultiPolygon: ['all', ['==', '$type', 'MultiPolygon']],
        MultiPoint: ['all', ['==', '$type', 'MultiPoint']],
        MultiLineString: ['all', ['==', '$type', 'MultiLineString']],
        GeometryCollection: ['all', ['==', '$type', 'GeometryCollection']],
    }

    mapEvents = [
        'resize',
        'remove',
        'mousedown',
        'mouseup',
        'mouseover',
        'mousemove',
        'click',
        'dblclick',
        'mouseenter',
        'mouseleave',
        'mouseout',
        'contextmenu',
        'wheel',
        'touchstart',
        'touchend',
        'touchmove',
        'touchcancel',
        'movestart',
        'move',
        'moveend',
        'dragstart',
        'drag',
        'dragend',
        'zoomstart',
        'zoom',
        'zoomend',
        'rotatestart',
        'rotate',
        'rotateend',
        'pitchstart',
        'pitch',
        'pitchend',
        'boxzoomstart',
        'boxzoomend',
        'boxzoomcancel',
        'webglcontextlost',
        'webglcontextrestored',
        'load',
        'render',
        'error',
        'data',
        'styledata',
        'sourcedata',
        'dataloading',
        'styledataloading',
        'sourcedataloading',
    ]

    mapsRegistry: MapRegistryItem[] = []

    createMap(this: Maps, mapName: string, mapOptions: MapboxOptions): Map {
        const map = new mapboxgl.Map(mapOptions)

        this.mapsRegistry.push({
            name: mapName,
            mapInstance: map,
            layers: {},
            arcGisLayers: {},
            mapLoaded: false,
        })
        this._setupMapListeners(mapName)
        return map
    }

    destroyMap(this: Maps, mapName: string) {
        const mapRegistryItem = this._mapRegistryForName(mapName)

        if (mapRegistryItem === undefined) {
            return
        }

        const { mapInstance } = mapRegistryItem

        if (mapInstance === undefined) {
            return
        }

        mapInstance.remove()
        this.mapsRegistry.removeObject(mapRegistryItem)
    }

    toggleVisibilityFor(mapName: string, payload: VisibilityChangedEventPayload) {
        const mapRegistryItem = this._mapRegistryForName(mapName)
        if (mapRegistryItem === undefined) {
            return
        }

        const { mapInstance, layers } = mapRegistryItem

        if (mapInstance) {
            const { filter, layerId } = payload

            // demon array equality code
            // @ts-ignore
            const indexOfExistingFilter = layers[layerId].filters.findIndex(a => a[2] === filter[2])
            if (indexOfExistingFilter > -1) {
                // @ts-ignore
                layers[layerId].filters = layers[layerId].filters
                    .slice(0, indexOfExistingFilter)
                    // @ts-ignore
                    .concat(layers[layerId].filters.slice(indexOfExistingFilter + 1))
            } else {
                // @ts-ignore
                layers[layerId].filters = [...layers[layerId].filters, filter]
            }

            // @ts-ignore
            mapInstance.setFilter(layerId, layers[layerId].filters)
        }
    }

    addDataSource(mapName: string, sourceId: number | string, dataSource: any) {
        const mapRegistryItem = this._mapRegistryForName(mapName)
        if (mapRegistryItem === undefined) {
            return
        }

        const { mapInstance } = mapRegistryItem

        if (mapInstance) {
            mapInstance.addSource(sourceId, dataSource)
        }
    }

    removeArcGisLayer(mapName: string, layerName: string) {
        const mapRegistryItem = this._mapRegistryForName(mapName)
        if (mapRegistryItem === undefined) {
            return
        }

        const { mapInstance, arcGisLayers } = mapRegistryItem

        const actualLayers = arcGisLayers[layerName]

        if (mapInstance) {
            actualLayers.forEach(layerName => {
                if (mapInstance.getLayer(layerName)) {
                    mapInstance.removeLayer(layerName)
                }

                if (mapInstance.getSource(layerName)) {
                    mapInstance.removeSource(layerName)
                }
            })
        }
    }

    addArcGisImageLayer(mapName: string, layerName: string, imageServiceUrl: string) {
        const mapRegistryItem = this._mapRegistryForName(mapName)
        if (mapRegistryItem === undefined) {
            return
        }

        const { mapInstance } = mapRegistryItem

        if (mapInstance) {
            const layers = mapInstance.getStyle().layers || []

            let labelLayerId
            for (let i = 0; i < layers.length; i++) {
                // @ts-ignore
                if (layers[i].type === 'symbol') {
                    labelLayerId = layers[i].id
                    break
                }
            }

            mapInstance.addLayer(
                {
                    id: layerName,
                    type: 'raster',
                    source: {
                        type: 'raster',
                        tiles: [imageServiceUrl],
                        tileSize: 256,
                    },
                },
                labelLayerId,
            )

            mapRegistryItem.arcGisLayers[layerName] = [layerName]
        }
    }

    async addArcGisLayer(
        mapName: string,
        layerName: string,
        layer: ArcGisServiceLayer,
    ): Promise<{ map?: Map }> {
        const mapRegistryItem = this._mapRegistryForName(mapName)

        const addedLayerIds: string[] = []

        if (mapRegistryItem === undefined) {
            return Promise.reject(`Map Registry item not found`)
        }

        const { mapInstance } = mapRegistryItem

        if (mapInstance === undefined) {
            return Promise.reject(`Map Registry item doesn't contain a map instance`)
        }

        try {
            for await (const action of layer.actions) {
                const { actionName, actionPayload } = action

                if (actionName === ADD_IMAGE) {
                    const { name, url } = actionPayload
                    await loadImageIntoMapInstance(url, name, mapInstance)
                }

                if (actionName === ADD_LAYER) {
                    mapInstance.addLayer(
                        Object.assign({}, actionPayload, {
                            source: {
                                type: 'geojson',
                                data: layer.data,
                            },
                        }),
                    )
                    addedLayerIds.push(actionPayload.id)
                }
            }
        } catch (error) {
            console.error(error)
            return Promise.reject(error)
        }

        mapRegistryItem.arcGisLayers[layerName] = addedLayerIds

        return Promise.resolve({ map: mapInstance })
    }

    _mapRegistryForName(mapName: string): MapRegistryItem | undefined {
        return this.mapsRegistry.findBy('name', mapName)
    }

    addPositionTrackingImages(mapName: string) {
        const mapRegistryItem = this._mapRegistryForName(mapName)

        if (mapRegistryItem === undefined) {
            return Promise.reject()
        }

        const { mapInstance } = mapRegistryItem

        if (mapInstance === undefined) {
            return Promise.reject
        }

        const truckingImages = [
            'cargo',
            'davit',
            'cranes',
            'pickup-truck',
            'trucking',
            'trucking-1',
            'trucking-2',
            'trucking-3',
            'trucking-4',
            'trucking-5',
            'trucking-6',
            'trucking-7',
            'trucking-8',
            'trucking-9',
            'trucking-10',
            'trucking-11',
            'trucking-12',
            'trucking-13',
            'trucking-14',
            'trucking-15',
            'trucking-16',
            'trucking-17',
            'trucking-18',
            'trucking-19',
            'trucking-20',
            'trucking-21',
            'trucking-22',
            'trucking-23',
            'trucking-24',
            'trucking-25',
            'trucking-26',
            'trucking-27',
            'trucking-28',
            'trucking-29',
            'trucking-30',
            'trucking-31',
            'trucking-32',
            'trucking-33',
            'trucking-34',
            'trucking-35',
            'trucking-36',
            'trucking-37',
            'trucking-38',
            'trucking-39',
            'trucking-40',
            'trucking-41',
            'trucking-42',
            'trucking-43',
            'trucking-44',
            'trucking-45',
            'helmet-engineer',
            'helmet-labourer',
            'helmet-environment',
            'helmet-community',
            'helmet-surveyor',
            'helmet-other',
            'helmet-safety',
            'helmet-foreman',
        ]

        return truckingImages.map(ti =>
            loadImageIntoMapInstance(
                `${config.fingerprintPrepend}/assets/pngs/illustrations/${ti}.png`,
                ti,
                mapInstance,
            ),
        )
    }

    async addPositionTrackingLabelImages(mapName: string) {
        const mapRegistryItem = this._mapRegistryForName(mapName)

        if (mapRegistryItem === undefined) {
            return Promise.reject()
        }

        const { mapInstance } = mapRegistryItem

        if (mapInstance === undefined) {
            return Promise.reject
        }

        const width = 90
        const bytesPerPixel = 4
        const data = new Uint8Array(width * width * bytesPerPixel)

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < width; y++) {
                const offset = (y * width + x) * bytesPerPixel
                data[offset] = 19 // red
                data[offset + 1] = 128 // green
                data[offset + 2] = 54 // blue

                // if (y > 30) {
                //     data[offset + 3] = 0 // alpha
                // } else {
                data[offset + 3] = 255 // alpha
                // }
            }
        }

        return loadImageIntoMapInstance(
            { width, height: width, data },
            'truck-tracking-label-bg',
            mapInstance,
        )
    }

    getDataSource(
        mapName: string,
        sourceId: string,
    ): VectorSource | RasterSource | RasterDemSource | GeoJSONSource | ImageSource | VideoSource {
        const mapRegistryItem = this._mapRegistryForName(mapName)

        if (mapRegistryItem === undefined) {
            // @ts-ignore
            return
        }

        const { mapInstance } = mapRegistryItem

        if (mapInstance === undefined) {
            // @ts-ignore
            return
        }
        return mapInstance.getSource(sourceId)
    }

    setDataForGeoJSONSource(mapName: string, sourceId: string, data: any) {
        // @ts-ignore
        const dataSource: GeoJSONSource = this.getDataSource(mapName, sourceId)

        if (!dataSource) {
            return
        }

        dataSource.setData(data)
    }

    async addPositionTrackingLayer(mapName: string, sourceId: string) {
        const mapRegistryItem = this._mapRegistryForName(mapName)

        if (mapRegistryItem === undefined) {
            return
        }

        const { mapInstance } = mapRegistryItem

        if (mapInstance === undefined) {
            return
        }

        await this.addPositionTrackingImages(mapName)
        await this.addPositionTrackingLabelImages(mapName)

        const imageScale = 0.05

        mapInstance.addLayer({
            id: 'clusters',
            type: 'circle',
            metadata: {
                zindex: 50,
            },
            source: sourceId.toString(),
            filter: ['has', 'point_count'],
            paint: {
                // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
                // with three steps to implement three types of circles:
                //   * Blue, 20px circles when point count is less than 100
                //   * Yellow, 30px circles when point count is between 100 and 750
                //   * Pink, 40px circles when point count is greater than or equal to 750
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#51bbd6',
                    50,
                    '#f1f075',
                    200,
                    '#f28cb1',
                ],
                'circle-radius': ['step', ['get', 'point_count'], 20, 50, 30, 200, 40],
            },
        })

        mapInstance.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: sourceId.toString(),
            metadata: {
                zindex: 51,
            },
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['B612 Bold', 'Arial Unicode MS Bold'],
                'text-size': 14,
            },
            paint: {
                'text-translate': [0, 4],
                'icon-translate-anchor': 'viewport',
                'text-translate-anchor': 'viewport',
            },
        })

        mapInstance.addLayer({
            id: `${sourceId}-truck-icon`,
            type: 'symbol',
            source: sourceId.toString(),
            metadata: {
                zindex: 45,
            },
            layout: {
                'icon-image': ['get', 'iconName'],
                'icon-allow-overlap': true,
                'icon-size': {
                    stops: [[10, imageScale], [14, 2 * imageScale]],
                },
                'icon-anchor': 'bottom',
            },
            filter: ['!', ['has', 'point_count']],
        })

        mapInstance.addLayer({
            id: `${sourceId}-truck-label`,
            type: 'symbol',
            source: sourceId.toString(),
            metadata: {
                zindex: 46,
            },
            // @ts-ignore
            layout: {
                'icon-offset': [-100, -100],
                'icon-image': 'truck-tracking-label-bg',
                'icon-allow-overlap': true,
                'icon-anchor': 'top',
                'icon-text-fit': 'both',
                'icon-text-fit-padding': [5, 7.5, 0, 7.5],
                'text-field': ['get', 'name'],
                'text-font': ['B612 Bold', 'Overpass Regular'],
                'text-anchor': 'top',
                'text-size': 12,
                'text-allow-overlap': true,
            },
            paint: {
                'text-translate': [0, 2],
                'icon-translate': [0, 2],

                'icon-translate-anchor': 'viewport',
                'text-translate-anchor': 'viewport',
                'text-color': '#FFFFFF',
            },

            filter: ['!', ['has', 'point_count']],
        })

        this.reorderLayers(mapName)
    }

    // standard layer we have in our DB
    addGeoJsonLayer(mapName: string, sourceId: number | string) {
        const mapRegistryItem = this._mapRegistryForName(mapName)

        if (mapRegistryItem === undefined) {
            return
        }

        const { mapInstance, layers } = mapRegistryItem

        if (mapInstance === undefined) {
            return
        }

        mapInstance.addLayer({
            id: `${sourceId}-linestring`,
            type: 'line',
            source: sourceId.toString(),
            filter: this.defaultFiltersForTypes['LineString'],
        })

        layers[`${sourceId}-linestring`] = {
            filters: this.defaultFiltersForTypes['LineString'],
        }

        mapInstance.addLayer({
            id: `${sourceId}-polygon`,
            type: 'line',
            source: sourceId.toString(),
            paint: {
                'line-width': 2,
                'line-color': '#000',
            },
            filter: this.defaultFiltersForTypes['Polygon'],
        })

        layers[`${sourceId}-polygon`] = {
            filters: this.defaultFiltersForTypes['Polygon'],
        }

        mapInstance.addLayer({
            id: `${sourceId}-point`,
            type: 'circle',
            source: sourceId.toString(),
            paint: {
                'circle-radius': 6,
                'circle-color': '#B42222',
            },
            filter: this.defaultFiltersForTypes['Point'],
        })

        layers[`${sourceId}-point`] = {
            filters: this.defaultFiltersForTypes['Point'],
        }

        this.reorderLayers(mapName)
    }

    isMapLoaded(mapName: string): boolean {
        const mapRegistryItem = this._mapRegistryForName(mapName)

        if (mapRegistryItem === undefined) {
            return false
        }

        const { mapLoaded } = mapRegistryItem
        return mapLoaded
    }

    reorderLayers(mapName: string) {
        const mapRegistryItem = this._mapRegistryForName(mapName)

        if (mapRegistryItem === undefined) {
            return
        }

        const { mapInstance } = mapRegistryItem

        if (mapInstance === undefined) {
            return
        }

        const style = mapInstance.getStyle()
        if (style == null || !style.layers) {
            return
        }

        const layers = style.layers

        const layersToReorder = layers
            .filter(value => value.metadata != null && value.metadata.zindex >= 0)
            .sort((a, b) => +a.metadata.zindex - +b.metadata.zindex)

        layersToReorder.forEach(value => mapInstance.moveLayer(value.id))
    }

    _setupMapListeners(mapName: string) {
        const mapRegistryItem = this._mapRegistryForName(mapName)
        if (mapRegistryItem === undefined) {
            return
        }

        const { mapInstance } = mapRegistryItem
        /**
         * we will essentially forward the map events from here, plus some of our own
         * then subscribe to events from our routes and components.
         * much cleaner this way I think
         */
        if (mapInstance) {
            this.mapEvents.forEach(eventName => {
                mapInstance.on('load', () => {
                    set(mapRegistryItem, 'mapLoaded', true)
                })

                mapInstance.on(eventName, (event: MapboxEvent | MapDataEvent) => {
                    this.trigger(`${eventName}:${mapName}`, event)
                })
            })
        }
    }
}

declare module '@ember/service' {
    interface Registry {
        maps: Maps
    }
}
