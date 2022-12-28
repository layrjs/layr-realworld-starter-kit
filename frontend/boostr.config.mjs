export default ({services}) => ({
  type: 'web-frontend',

  dependsOn: 'backend',

  environment: {
    FRONTEND_URL: services.frontend.url,
    BACKEND_URL: services.backend.url
  },

  rootComponent: './src/index.js',

  html: {
    language: 'en',
    head: {
      title: services.frontend.environment.APPLICATION_NAME,
      metas: [
        {name: 'description', content: services.frontend.environment.APPLICATION_DESCRIPTION},
        {charset: 'utf-8'},
        {name: 'viewport', content: 'width=device-width, initial-scale=1'},
        {'http-equiv': 'x-ua-compatible', 'content': 'ie=edge'}
      ],
      links: [
        {rel: 'icon', href: '/layr-favicon-3vtu1VGUfUfDawVC0zL4Oz.immutable.png'},
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css?family=Titillium+Web:700|Source+Serif+Pro:400,700|Merriweather+Sans:400,700|Source+Sans+Pro:400,300,600,700,300italic,400italic,600italic,700italic'
        },
        {
          rel: 'stylesheet',
          href: 'https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css'
        },
        {
          rel: 'stylesheet',
          href: 'https://demo.productionready.io/main.css'
        }
      ]
    }
  },

  stages: {
    development: {
      url: 'http://localhost:13577/',
      platform: 'local'
    },
    production: {
      url: 'https://react-layr-realworld-example-app.layrjs.com/',
      platform: 'aws',
      aws: {
        region: 'us-west-2',
        cloudFront: {
          priceClass: 'PriceClass_100'
        }
      }
    }
  }
});
