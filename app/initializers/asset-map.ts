import Application from '@ember/application'
// @ts-ignore
import fetch from 'fetch'

import EmberObject from '@ember/object'

export async function initialize(application: Application): void {
    // // application.inject('route', 'foo', 'service:foo');
    //
    // application.deferReadiness()
    //
    // const assetMap = await fetch(`/assets/assetMap.json`).then((r: any) => r.json()).console.lo
    //
    // const AssetMap = EmberObject.extend()
    //
    // AssetMap.reopen({
    //     resolve: function(assetName: string): string {
    //         return assetMap.assets[assetName]
    //     },
    // })
    //
    // application.register('assetMap:main', AssetMap, { singleton: true })
    //
    // application.inject('component', 'assets', 'assetMap:main')
    // application.inject('service', 'assets', 'assetMap:main')
    // application.advanceReadiness()
}

export default {
    initialize,
}
