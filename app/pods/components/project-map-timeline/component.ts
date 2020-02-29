import Component from '@ember/component'

import { inject as service } from '@ember-decorators/service'
import { classNames } from '@ember-decorators/component'
import Project from 'cloudscape/pods/project/model'
import Timeline from 'cloudscape/pods/timeline/service'

@classNames('bg-white shadow-lg border-grey border rounded-sm px-3 py-2')
export default class ProjectMapTimeline extends Component {
    @service timeline!: Timeline
    project!: Project
}
