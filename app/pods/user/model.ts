import DS from 'ember-data'
import { computed } from '@ember-decorators/object'
import { get } from '@ember/object'

const { Model, attr, belongsTo } = DS
export default class User extends Model.extend({
    name: attr('string'),
    email: attr('string'),
    description: attr('string'),
    role: belongsTo('role'),
    project: belongsTo('project'),
}) {
    @computed('role.name')
    get roleName() {
        //@ts-ignore
        return get(this, 'role.name') || get(this, 'description')
    }
}

declare module 'ember-data/types/registries/model' {
    export default interface ModelRegistry {
        user: User
    }
}
