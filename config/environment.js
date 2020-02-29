'use strict'

module.exports = function(environment) {
    let deployTarget = process.env.DEPLOY_TARGET

    let ENV = {
        modulePrefix: 'cloudscape',
        environment,
        rootURL: '/',
        routerRootURL: '/',
        fingerprintPrepend: '',
        locationType: 'auto',
        podModulePrefix: 'cloudscape/pods',
        fastboot: {
            hostWhitelist: ['api.cloudscape.test', 'app.cloudscape.test', /^localhost:\d+$/],
        },
        EmberENV: {
            FEATURES: {
                // Here you can enable experimental features on an ember canary build
                // e.g. 'with-controller': true
            },
            EXTEND_PROTOTYPES: {
                // Prevent Ember Data from overriding Date.parse.
                Date: false,
            },
        },

        APP: {
            // Here you can pass flags/options to your application instance
            // when it is created
        },
    }

    if (environment === 'development') {
        // ENV.APP.LOG_RESOLVER = true
        // ENV.APP.LOG_ACTIVE_GENERATION = true;
        // ENV.APP.LOG_TRANSITIONS = true
        // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
        // ENV.APP.LOG_VIEW_LOOKUPS = true;

        ENV.APP.lendLeaseArcGisServer =
            'https://thegisserver.lendlease.com:6443/arcgis/rest/services'

        ENV.APP.apiUrl = 'http://localhost:3000'
    }

    if (environment === 'test') {
        // Testem prefers this...
        ENV.locationType = 'none'

        // keep test console output quieter
        ENV.APP.LOG_ACTIVE_GENERATION = false
        ENV.APP.LOG_VIEW_LOOKUPS = false

        ENV.APP.rootElement = '#ember-testing'
        ENV.APP.autoboot = false
    }

    if (deployTarget === 'qa') {
        ENV.APP.apiUrl = 'https://dev-dc.myvirtualsuper.com/api'
        ENV.APP.lendLeaseArcGisServer =
            'https://thegisserver.lendlease.com:6443/arcgis/rest/services'
    }

    if (deployTarget === 'staging') {
        ENV.APP.apiUrl = 'https://staging-node.myvirtualsuper.com'
        ENV.fingerprintPrepend = 'https://csl-static-staging.s3-ap-southeast-2.amazonaws.com'
        ENV.routerRootURL = '/maps-beta'
        ENV.APP.lendLeaseArcGisServer =
            'https://thegisserver.lendlease.com:6443/arcgis/rest/services'
    }

    if (deployTarget === 'production') {
        ENV.APP.apiUrl = 'https://node.myvirtualsuper.com'
        ENV.fingerprintPrepend = 'https://csl-static-prod.s3-ap-southeast-2.amazonaws.com'
        ENV.routerRootURL = '/maps-beta'
        ENV.APP.lendLeaseArcGisServer =
            'https://thegisserver.lendlease.com:6443/arcgis/rest/services'
    }

    ENV['mapbox-gl'] = {
        accessToken: 'pk.eyJ1IjoiYW90ZWFzdHVkaW9zIiwiYSI6IkpWRG1DanMifQ.n_qwTIutVxuoHFzQsw085A',
    }

    ENV['ember-simple-auth'] = {
        baseURL: '/',
        routeAfterAuthentication: 'projects',
        routeIfAlreadyAuthenticated: 'projects',
    }

    ENV['ember-cli-tailwind'] = {
        shouldBuildTailwind: true,
        shouldIncludeStyleGuide: false,
    }

    return ENV
}
