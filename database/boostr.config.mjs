export default () => ({
  type: 'database',

  stages: {
    development: {
      url: 'mongodb://localhost:13579/dev',
      platform: 'local'
    }
  }
});
