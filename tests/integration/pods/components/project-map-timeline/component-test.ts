import { module, test } from 'qunit'
import { setupRenderingTest } from 'ember-qunit'
import { render } from '@ember/test-helpers'
import hbs from 'htmlbars-inline-precompile'

module('Integration | Component | project-map-timeline', function(hooks) {
    setupRenderingTest(hooks)

    test('it renders', async function(assert) {
        // Set any properties with this.set('myProperty', 'value');
        // Handle any actions with this.set('myAction', function(val) { ... });

        await render(hbs`{{project-map-timeline}}`)

        assert.equal(this.element.textContent.trim(), '')

        // Template block usage:
        await render(hbs`
      {{#project-map-timeline}}
        template block text
      {{/project-map-timeline}}
    `)

        assert.equal(this.element.textContent.trim(), 'template block text')
    })
})