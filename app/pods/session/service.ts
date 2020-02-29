import SessionService from 'ember-simple-auth/services/session'
import { reads } from '@ember-decorators/object/computed'

export default class Session extends SessionService {
    // @ts-ignore
    @reads('data.authenticated.token') accessToken: string
}

declare module '@ember/service' {
    interface Registry {
        session: Session
    }
}
