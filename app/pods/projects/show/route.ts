import Route from '@ember/routing/route'
import Project from 'cloudscape/pods/project/model'

export default class ProjectsShow extends Route.extend() {
    model({ project_id }: { project_id: number }) {
        return this.store.hasRecordForId('project', project_id)
            ? this.store.peekRecord('project', project_id)
            : this.store.findRecord('project', project_id)
    }

    redirect(_: Project, transition: any) {
        const { targetName } = transition

        if (targetName === 'projects.show.index' || targetName === 'projects.show.map.index') {
            this.transitionTo('projects.show.map.users')
        }
    }
}
