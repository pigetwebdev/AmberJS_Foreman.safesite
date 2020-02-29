import Controller from '@ember/controller'

import { inject as service } from '@ember-decorators/service'
import Timeline from 'cloudscape/pods/timeline/service'

export default class PositionsIndex extends Controller {
    // normal class body definition here
    @service timeline!: Timeline
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module '@ember/controller' {
    interface Registry {
        'positions/index': PositionsIndex
    }
}
