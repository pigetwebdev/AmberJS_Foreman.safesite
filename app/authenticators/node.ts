import BaseAuthenticator from 'ember-simple-auth/authenticators/base'
import fetch from 'fetch'
import ENV from 'cloudscape/config/environment'

export default class extends BaseAuthenticator {
    async authenticate({ email, password }: { email: string; password: string }) {
        const response = await fetch(`${ENV.APP.apiUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        })

        return new Promise(async (resolve, reject) => {
            const { status } = response

            // not using status codes correctly
            if (status === 200) {
                const json = await response.json()

                if (json['error']) {
                    return reject({ status: 401, message: json['message'] })
                }

                if (json['message'] && json['message'] === 'Missing credentials') {
                    return reject({ status: 401, message: json['message'] })
                }

                return resolve(json)
            } else {
                return reject({ status: 401 })
            }
        })
    }

    restore(session) {
        return Promise.resolve(session)
    }

    invalidate() {
        return Promise.resolve()
    }
}
