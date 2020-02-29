import { module, test } from 'qunit'
import { setupTest } from 'ember-qunit'

module('Unit | Route | positions/index', function(hooks) {
    setupTest(hooks)

    test('it exists', function(assert) {
        let route = this.owner.lookup('route:positions/index')
        assert.ok(route)
    })
})
