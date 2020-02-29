import DS from 'ember-data'
import { AllGeoJSON } from '@turf/turf'

const Geojson = DS.Transform.extend({
    deserialize(serialized: any): AllGeoJSON {
        return serialized
    },

    serialize(deserialized: AllGeoJSON): any {
        return deserialized
    },
})

declare module 'ember-data/types/registries/transform' {
    export default interface TransformRegistry {
        geojson: AllGeoJSON
    }
}

export default Geojson
