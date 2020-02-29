import DS from 'ember-data'
import { computed } from '@ember-decorators/object'

import { bbox, center, getCoord } from '@turf/turf'
import { BBox } from 'geojson'
import { get } from '@ember/object'

const { Model, attr } = DS

export default class Project extends Model.extend({
    name: attr('string'),
    timezone: attr('string'),
    createdAt: attr('date'),
    updatedAt: attr('date'),
    deletedAt: attr('date'),
    boundary: attr('geojson'),
    arcgisServiceName: attr('string'),
}) {
    @computed('boundary')
    get mapCenter(): number[] {
        return getCoord(center(get(this, 'boundary')))
    }

    @computed('boundary')
    get mapBounds(): BBox {
        return bbox(get(this, 'boundary'))
    }
}

declare module 'ember-data/types/registries/model' {
    export default interface ModelRegistry {
        project: Project
    }
}
