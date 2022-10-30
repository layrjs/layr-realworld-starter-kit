export default ({services}) => ({
  type: 'backend',

  dependsOn: 'database',

  environment: {
    FRONTEND_URL: services.frontend.url,
    BACKEND_URL: services.backend.url,
    DATABASE_URL: services.database.url
  },

  stages: {
    development: {
      url: 'http://localhost:13578/',
      platform: 'local'
    },
    production: {
      url: 'https://backend.react-layr-realworld-example-app.layrjs.com/',
      platform: 'aws',
      aws: {
        region: 'us-west-2',
        lambda: {
          memorySize: 1024,
          timeout: 15
        }
      }
    }
  }
});
