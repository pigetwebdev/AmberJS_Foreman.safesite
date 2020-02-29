import Component from '@ember/component'
import formBufferProperty from 'ember-validated-form-buffer'
import { buildValidations, validator } from 'ember-cp-validations'
import { get, getProperties, set } from '@ember/object'

import { classNames } from '@ember-decorators/component'
import { inject as service } from '@ember-decorators/service'
import { action, computed } from '@ember-decorators/object'
import Session from 'cloudscape/pods/session/service'

const Validations = buildValidations({
    email: validator('presence', true),
    password: validator('presence', true),
})

@classNames('')
export default class LoginForm extends Component.extend({
    credentials: { email: null, password: null },
    data: formBufferProperty('credentials', Validations),
}) {
    @service session!: Session

    isLoggingIn = false
    errorStatusCode: undefined

    @computed('data.clientErrors')
    get hasClientErrors() {
        return Object.keys(get(this, 'data.clientErrors')).length !== 0
    }

    @action
    async submitForm() {
        return await this.login()
    }

    @action
    async login() {
        const hasClientErrors = this.hasClientErrors

        if (hasClientErrors) {
            return false
        }
        set(this, 'isLoggingIn', true)

        try {
            this.data.applyBufferedChanges()
        } catch (error) {
            console.error(error)
        }

        const { session, credentials } = getProperties(this, 'session', 'credentials')

        try {
            return await session.authenticate('authenticator:node', credentials)
        } catch (error) {
            set(this, 'errorStatusCode', error.status)
            set(this, 'isLoggingIn', false)
            return error
        }
    }
}
