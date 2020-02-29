import Component from '@ember/component'
import { MapboxOptions, Map, IControl } from 'mapbox-gl'
import { set } from '@ember/object'
import { inject as service } from '@ember-decorators/service'
import Maps from 'cloudscape/pods/maps/service'
import { CompassControl, RulerControl, StylesControl, ZoomControl } from 'mapbox-gl-controls'
import MapboxTraffic from '@mapbox/mapbox-gl-traffic'

export default class MapboxMap extends Component {
    @service maps!: Maps
    mapName!: string
    map!: Map
    center!: [number, number]

    rulerControl!: IControl
    zoomControl!: IControl
    compassControl!: IControl
    mapboxTraffic!: IControl

    willDestroyElement() {
        this.maps.destroyMap(this.mapName)
    }

    didInsertElement() {
        const options: MapboxOptions = {
            container: this.element,
            style: 'mapbox://styles/aoteastudios/cjr78rs2oh4ss2slxp9m4snt1',
            attributionControl: false,
            minZoom: 9,
            center: this.center,
        }

        const map = this.maps.createMap(this.mapName, options)

        map.on('error', error => {
            console.log('map error')
            console.error(error)
        })

        map.once('load', () => {
            const layers = map.getStyle().layers || []

            let labelLayerId
            for (let i = 0; i < layers.length; i++) {
                // @ts-ignore
                if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                    labelLayerId = layers[i].id
                    break
                }
            }

            map.addLayer(
                {
                    id: '3d-buildings',
                    source: 'composite',
                    'source-layer': 'building',
                    filter: ['==', 'extrude', 'true'],
                    type: 'fill-extrusion',
                    minzoom: 15,
                    paint: {
                        'fill-extrusion-color': '#aaa',

                        // use an 'interpolate' expression to add a smooth transition effect to the
                        // buildings as the user zooms in
                        'fill-extrusion-height': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'height'],
                        ],
                        'fill-extrusion-base': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'min_height'],
                        ],
                        'fill-extrusion-opacity': 0.6,
                    },
                },
                labelLayerId,
            )
        })

        this.rulerControl = new RulerControl()
        this.zoomControl = new ZoomControl()
        this.compassControl = new CompassControl()
        this.mapboxTraffic = new MapboxTraffic()

        map.addControl(this.rulerControl, 'top-right')
        map.addControl(this.zoomControl, 'top-right')
        map.addControl(this.compassControl, 'top-right')
        map.addControl(this.mapboxTraffic)
        set(this, 'map', map)

        // map.addControl(new BuildingExtrusionControl(), 'top-right')

        // map.addControl(
        //     new StylesControl([
        //         {
        //             name: 'Streets',
        //             url: 'mapbox://styles/mapbox/streets-v10',
        //         },
        //         {
        //             name: 'Satellite',
        //             url: 'mapbox://styles/mapbox/satellite-v9',
        //         },
        //         {
        //             name: 'Dark',
        //             url: 'mapbox://styles/mapbox/dark-v9',
        //         },
        //     ]),
        //     'top-left',
        // )
    }
}
