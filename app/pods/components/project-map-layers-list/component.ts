import Component from '@ember/component'
import { inject as service } from '@ember-decorators/service'
import { action, computed } from '@ember-decorators/object'
import Maps from 'cloudscape/pods/maps/service'
import LayerManager, { Geometry, LayerGroup } from 'cloudscape/pods/layer-manager/service'

import Project from 'cloudscape/pods/project/model'

export default class ProjectMapLayersList extends Component.extend({}) {
    @service maps!: Maps
    @service layerManager!: LayerManager
    project!: Project

    @computed('layerManager.layerRegistry.[]')
    get layerGroups() {
        return this.layerManager.layersFor(this.project.id)
    }

    @action
    toggleVisibility(layer: LayerGroup, feature: Geometry) {
        const options = {
            projectId: this.project.id,
            feature: feature,
            layerId: layer.id,
        }
        this.layerManager.toggleFeatureVisibility(options)
    }
}
