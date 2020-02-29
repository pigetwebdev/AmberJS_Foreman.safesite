export default {
    name: 'current-user-injection',
    after: 'session-injection',
    initialize(appInstance) {
        appInstance.inject('route', 'currentUser', 'service:currentUser')
        appInstance.inject('controller', 'currentUser', 'service:currentUser')
        appInstance.inject('component', 'currentUser', 'service:currentUser')
    },
}
