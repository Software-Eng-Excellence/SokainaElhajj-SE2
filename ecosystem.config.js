// eslint-disable-next-line no-undef
module.exports = {
    name: 'se2',
    script: './build/src/index.js',
    exec_mode: 'fork',
    instances: '1',
    env: {
        NODE_ENV: 'development'
    },
    env_production: {
        NODE_ENV: 'production'
    },
    env_stage: {
        NODE_ENV: 'stage'
    }
}