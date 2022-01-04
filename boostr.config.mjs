export default () => ({
  type: 'application',

  name: 'Conduit',
  description: 'A place to share your knowledge.',

  services: {
    frontend: './frontend',
    backend: './backend',
    database: './database'
  },

  stages: {
    production: {
      environment: {
        NODE_ENV: 'production'
      }
    }
  }
});
