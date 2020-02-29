import Route from '@ember/routing/route'
import { set } from '@ember/object'
import { inject as service } from '@ember-decorators/service'
import LayerManager from 'cloudscape/pods/layer-manager/service'
// @ts-ignore
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin'
import Project from 'cloudscape/pods/project/model'

// @ts-ignore
export default class ProjectsShowMap extends Route.extend(AuthenticatedRouteMixin) {
    @service layerManager!: LayerManager

    setupController(controller: any) {
        set(controller, 'project', this.modelFor('projects.show'))
        return super.setupController()
    }

    deactivate() {
        const { id: projectId } = this.modelFor('projects.show')
    }

    redirect(_: Project, transition: any) {
        const { targetName } = transition

        if (targetName === 'projects.show.map') {
            this.transitionTo('projects.show.map.users')
        }
    }
}
