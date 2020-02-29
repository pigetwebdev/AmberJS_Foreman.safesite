module.exports = {
    root: true,
    parser: 'babel-eslint',
    parserOptions: {
        ecmaVersion: 2017,
        sourceType: 'module',
    },
    plugins: ['ember'],
    extends: ['eslint:recommended', 'plugin:ember/recommended'],
    env: {
        browser: true,
    },
    rules: {
        semi: ['error', 'never'],
        'object-curly-spacing': [
            'error',
            'always',
            {
                arraysInObjects: true,
                objectsInObjects: true,
            },
        ],
        'space-in-parens': ['error', 'never'],
        quotemark: {
            severity: 'warning',
            options: ['single'],
        },
    },
    overrides: [
        // node files
        {
            files: ['testem.js', 'ember-cli-build.js', 'config/**/*.js'],
            parserOptions: {
                sourceType: 'script',
                ecmaVersion: 2015,
            },
            env: {
                browser: false,
                node: true,
            },
        },

        // test files
        {
            files: ['tests/**/*.js'],
            excludedFiles: ['tests/dummy/**/*.js'],
            env: {
                embertest: true,
            },
        },
    ],
}
