import EmberRouter from '@ember/routing/router'
import config from './config/environment'

const Router = EmberRouter.extend({
    location: config.locationType,
    rootURL: config.routerRootURL,
})

Router.map(function() {
    this.route('login')
    this.route('home', { path: '/' })
    this.route('projects', function() {
        this.route('index', { path: '/' })

        this.route('show', { path: '/:project_id' }, function() {
            this.route('map', function() {
                this.route('users')
                this.route('layers')
                this.route('settings')
            })
        })
    })
    this.route('positions', function() {})
})

export default Router
