import Route from '@ember/routing/route'
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin'

export default class Home extends Route.extend(AuthenticatedRouteMixin, {
    // anything which *must* be merged to prototype here
}) {
    // normal class body definition here
}
