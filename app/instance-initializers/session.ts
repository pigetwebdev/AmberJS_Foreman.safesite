export default {
    name: 'session-injection',
    after: 'ember-simple-auth',
    initialize(appInstance) {
        appInstance.inject('route', 'session', 'service:session')
        appInstance.inject('controller', 'session', 'service:session')
        appInstance.inject('component', 'session', 'service:session')
    },
}
