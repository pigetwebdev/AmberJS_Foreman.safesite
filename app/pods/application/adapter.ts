import DS from 'ember-data'
import ENV from 'cloudscape/config/environment'
import { get } from '@ember/object'
// @ts-ignore
import DataAdapterMixin from 'ember-simple-auth/mixins/data-adapter-mixin'

const { RESTAdapter } = DS

// @ts-ignore
export default class Application extends RESTAdapter.extend(DataAdapterMixin, {
    // anything which *must* be merged on the prototype
    host: ENV.APP.apiUrl,
    namespace: 'v7',

    //@ts-ignore
    authorize(xhr: any) {
        const { token } = get(this, 'session.data.authenticated')
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    },
}) {
    // normal class body
}

// DO NOT DELETE: this is how TypeScript knows how to look up your adapters.
declare module 'ember-data/types/registries/adapter' {
    export default interface AdapterRegistry {
        application: Application
    }
}
