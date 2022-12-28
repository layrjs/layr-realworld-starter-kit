export default () => ({
  type: 'application',

  services: {
    frontend: './frontend',
    backend: './backend',
    database: './database'
  },

  environment: {
    APPLICATION_NAME: 'Conduit',
    APPLICATION_DESCRIPTION: 'A place to share your knowledge.'
  },

  stages: {
    production: {
      environment: {
        NODE_ENV: 'production'
      }
    }
  }
});
