import DS from 'ember-data'

const { RESTSerializer } = DS

export default class Application extends RESTSerializer {
    keyForRelationship(key: string, relationship: string) {
        return relationship === 'belongsTo' ? `${key}Id` : `${key}Ids`
    }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your serializers.
declare module 'ember-data/types/registries/serializer' {
    export default interface SerializerRegistry {
        application: Application
    }
}
