import config from 'cloudscape/config/environment'
import fetch from 'fetch'
import Application from '@ember/application'

export async function initialize(application: Application) {
    application.deferReadiness()
    if (window) {
        const symbols = await fetch(`${config.fingerprintPrepend}/assets/symbols.svg`).then(r =>
            r.text(),
        )

        const div = document.createElement('div')
        div.innerHTML = symbols
        document.body.insertBefore(div, document.body.childNodes[0])
    }
    application.advanceReadiness()
}

export default {
    initialize,
}
