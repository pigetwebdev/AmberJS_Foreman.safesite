'use strict'

const EmberApp = require('ember-cli/lib/broccoli/ember-app')
const Funnel = require('broccoli-funnel')

module.exports = function(defaults) {
    const fingerprint = {
        enabled: true,
        generateAssetMap: true,
        exclude: ['assets/pngs/illustrations'],
    }

    const svgJar = {
        strategy: ['symbol', 'inline'],
        symbol: {
            sourceDirs: ['public/assets/svgs/illustrations'],
            includeLoader: false,
        },
        inline: {
            sourceDirs: ['public/assets/svgs/icons'],
            optimizer: {
                plugins: [
                    { cleanupAttrs: true },
                    { removeDoctype: true },
                    { removeXMLProcInst: true },
                    { removeComments: true },
                    { removeMetadata: true },
                    { removeTitle: true },
                    { removeDesc: true },
                    { removeUselessDefs: true },
                    { removeEditorsNSData: true },
                    { removeEmptyAttrs: true },
                    { removeHiddenElems: true },
                    { removeEmptyText: true },
                    { removeEmptyContainers: true },
                    { removeViewBox: false },
                    { cleanUpEnableBackground: true },
                    { convertStyleToAttrs: true },
                    { convertColors: true },
                    { convertPathData: true },
                    { convertTransform: true },
                    { removeUnknownsAndDefaults: true },
                    { removeNonInheritableGroupAttrs: true },
                    { removeUselessStrokeAndFill: true },
                    { removeUnusedNS: true },
                    { cleanupIDs: true },
                    { cleanupNumericValues: true },
                    { moveElemsAttrsToGroup: true },
                    { moveGroupAttrsToElems: true },
                    { collapseGroups: true },
                    { removeRasterImages: false },
                    { mergePaths: true },
                    { convertShapeToPath: true },
                    { sortAttrs: true },
                    { transformsWithOnePath: false },
                    { removeDimensions: true },
                    { removeAttrs: { attrs: '(stroke|fill)' } },
                ],
            },
        },
    }

    if (process.env.DEPLOY_TARGET === 'staging') {
        fingerprint.prepend = 'https://csl-static-staging.s3-ap-southeast-2.amazonaws.com/'
    }

    if (process.env.DEPLOY_TARGET === 'production') {
        fingerprint.prepend = 'https://csl-static-prod.s3-ap-southeast-2.amazonaws.com/'
    }

    let app = new EmberApp(defaults, {
        fingerprint,
        babel: {
            plugins: [require('ember-auto-import/babel-plugin'), ''],
        },
        'ember-cli-babel': {
            includePolyfill: true,
        },
        // '@ember-decorators/babel-transforms': {
        //     decoratorsBeforeExport: false,
        // },
        // sassOptions: {
        //     implementation: require('node-sass'),
        // },
        'ember-fetch': {
            preferNative: true,
        },
        svgJar,
        autoImport: {
            alias: {
                'mapbox-gl-controls': 'mapbox-gl-controls/lib',
            },
            exclude: ['@esri/arcgis-rest-common-types'],
        },
    })

    app.import('node_modules/mapbox-gl/dist/mapbox-gl.css')

    return app.toTree()
}
