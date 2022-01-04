export default () => ({
  stages: {
    development: {
      environment: {
        JWT_SECRET: '********'
      }
    },
    production: {
      environment: {
        JWT_SECRET: '********'
      }
    }
  }
});
