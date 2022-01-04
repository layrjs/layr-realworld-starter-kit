# ![RealWorld Example App](assets/logo.png)

> ### Layr/React codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://github.com/gothinkster/realworld) spec and API.

### [Demo](https://react-layr-realworld-example-app.layrjs.com/)&nbsp;&nbsp;&nbsp;&nbsp;[RealWorld](https://github.com/gothinkster/realworld)

This codebase was created to demonstrate a fully fledged fullstack application built with [Layr](https://layrjs.com/) and [React](https://reactjs.org/) including CRUD operations, authentication, routing, pagination, and more.

> Note: This implementation uses Layr v2, which is published on npm but not yet documented

## How it works

### General architecture

Thanks to the API-less approach of [Layr](https://layrjs.com/), the frontend communicates directly with the backend without the need to build an API layer.

### Hosting

- The frontend is statically hosted in AWS S3 + CloudFront.
- The backend is exposed via a single function hosted in AWS Lambda.
- The database is hosted in a MongoDB Atlas cluster (free tier).

## Prerequisites

- Make sure your have a [Node.js](https://nodejs.org/) (v14 or newer) installed.
- Make sure you have [Boostr](https://boostr.dev/) installed as it is used to manage the development environment.

## Installation

Install all the npm dependencies with the following command:

```sh
boostr install
```

## Development

### Configuration

- Generate a JWT secret by running the following command in your terminal:
  - `openssl rand -hex 64`
- In the `backend` directory, duplicate the `boostr.config.private-template.mjs` file, name it `boostr.config.private.mjs`, and modify it to set all the required private development environment variables.

### Migrating the database

Migrate the database with the following command:

```sh
boostr database migrate
```

### Starting the development environment

Start the development environment with the following command:

```
boostr start
```

The website should be available at http://localhost:13577.

## Production

### Configuration

- Generate a JWT secret by running the following command in your terminal:
  - `openssl rand -hex 64`
- In the `backend` directory, duplicate the `boostr.config.private-template.mjs` file, name it `boostr.config.private.mjs`, and modify it to set all the required private production environment variables.
- In the `database` directory, duplicate the `boostr.config.private-template.mjs` file, name it `boostr.config.private.mjs`, and modify it to set the `stages.production.url` attribute to the URL of your production MongoDB database.

### Migrating the database

Migrate the database with the following command:

```sh
boostr database migrate --production
```

### Deployment

Deploy the website to production with the following command:

```
boostr deploy --production
```

The website should be available at https://react-layr-realworld-example-app.layrjs.com.
