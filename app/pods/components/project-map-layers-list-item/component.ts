import Component from '@ember/component'
import { classNames, tagName } from '@ember-decorators/component'

@tagName('li')
@classNames('flex items-center px-3 py-4 border border-grey-light mb-2 bg-grey-lightest rounded-sm')
export default class ProjectMapLayersListItem extends Component {}
