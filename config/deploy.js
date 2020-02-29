var VALID_DEPLOY_TARGETS = ['dev', 'qa', 'production', 'staging']

module.exports = function(deployTarget) {
    var ENV = {
        build: {},
        s3: {
            acl: 'public-read',
        },
        pipeline: {
            disabled: {},
            activateOnDeploy: true,
            allowOverwrite: true,
        },
    }

    if (VALID_DEPLOY_TARGETS.indexOf(deployTarget) === -1) {
        throw new Error('Invalid deployTarget ' + deployTarget)
    }

    if (deployTarget === 'dev') {
        ENV.build.environment = 'development'
    }

    if (deployTarget === 'qa' || deployTarget === 'production' || deployTarget === 'staging') {
        ENV.build.environment = 'production'
        ENV.s3.accessKeyId = process.env.AWS_KEY
        ENV.s3.secretAccessKey = process.env.AWS_SECRET
        ENV.s3.region = 'ap-southeast-2'
    }

    // Deploy everything to S3 and disable the ssh index upload
    if (deployTarget === 'qa') {
        ENV.pipeline.disabled = {
            'ssh-index': true,
        }

        ENV.s3.bucket = 'csl-david-s3'

        ENV['s3-index'] = {
            bucket: ENV.s3.bucket,
            region: ENV.s3.region,
            allowOverwrite: true,
        }
    }

    // Deploy to S3 and then deploy the index file via SSH
    if (deployTarget === 'staging') {
        ENV.pipeline.disabled = {
            's3-index': true,
        }

        ENV.s3.bucket = 'csl-static-staging'

        ENV['ssh-index'] = {
            remoteDir: '/home/ec2-user/hq/ember',
            username: 'ec2-user',
            host: 'ec2-13-238-41-220.ap-southeast-2.compute.amazonaws.com',
            privateKeyFile: '~/.ssh/buildkite_rsa',
            allowOverwrite: true,
        }
    }

    // Deploy to S3 and then deploy the index file via SSH
    if (deployTarget === 'production') {
        ENV.pipeline.disabled = {
            's3-index': true,
        }

        ENV.s3.bucket = 'csl-static-prod'

        ENV['ssh-index'] = {
            remoteDir: '/home/ec2-user/hq/ember',
            username: 'ec2-user',
            host: 'ec2-13-239-122-205.ap-southeast-2.compute.amazonaws.com',
            privateKeyFile: '~/.ssh/buildkite_rsa',
            allowOverwrite: true,
        }
    }

    return ENV

    /* Note: a synchronous return is shown above, but ember-cli-deploy
     * does support returning a promise, in case you need to get any of
     * your configuration asynchronously. e.g.
     *
     *    var Promise = require('ember-cli/lib/ext/promise');
     *    return new Promise(function(resolve, reject){
     *      var exec = require('child_process').exec;
     *      var command = 'heroku config:get REDISTOGO_URL --app my-app-' + deployTarget;
     *      exec(command, function (error, stdout, stderr) {
     *        ENV.redis.url = stdout.replace(/\n/, '').replace(/\/\/redistogo:/, '//:');
     *        if (error) {
     *          reject(error);
     *        } else {
     *          resolve(ENV);
     *        }
     *      });
     *    });
     *
     */
}
