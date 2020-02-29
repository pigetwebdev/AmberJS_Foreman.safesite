import DS from 'ember-data'

const { Model, attr, hasMany } = DS

export default class Role extends Model.extend({
    name: attr('string'),
    user: hasMany('user', { inverse: 'role' }),
}) {
    // normal class body definition here
}

// DO NOT DELETE: this is how TypeScript knows how to look up your models.
declare module 'ember-data/types/registries/model' {
    export default interface ModelRegistry {
        role: Role
    }
}
