import Application from '@ember/application'

export function initialize(application: Application): void {
    application.deferReadiness()

    if (localStorage.getItem('savedState')) {
        // @ts-ignore
        const { token, ...user } = JSON.parse(localStorage.getItem('savedState'))

        const session = { authenticated: { authenticator: 'authenticator:node', user, token } }

        localStorage.setItem('ember_simple_auth-session', JSON.stringify(session))
    }

    application.advanceReadiness()
}

export default {
    initialize,
}
