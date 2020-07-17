# ![RealWorld Example App](assets/logo.png)

> ### React/Liaison codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://github.com/gothinkster/realworld) spec and API.

### [Demo](https://react-liaison-realworld-example-app.liaison.dev/)&nbsp;&nbsp;&nbsp;&nbsp;[RealWorld](https://github.com/gothinkster/realworld)

This codebase was created to demonstrate a fully fledged fullstack application built with [React](https://reactjs.org/) and [Liaison](https://liaison.dev/) including CRUD operations, authentication, routing, pagination, and more.

# How it works

## General architecture

Both the frontend and the backend use Liaison [Liaison](https://liaison.dev/), so there is no web API in between. The frontend communicate directly with the backend.

## Hosting

- The frontend is statically hosted in AWS S3 + CloudFront.
- The backend is exposed via a single function hosted in AWS Lambda.
- The database is hosted in a MongoDB Atlas cluster (free tier).

# Install

## Install

Install the npm dependencies with:

```sh
npm install
```

Make sure you have [Docker](https://www.docker.com/) installed as it is used to run the database (MongoDB) when running the app in development mode.

## Usage

### Running the app in development mode

Execute the following command:

```sh
FRONTEND_URL=http://localhost:13577 \
  BACKEND_URL=http://localhost:13578 \
  MONGODB_STORE_CONNECTION_STRING=mongodb://test:test@localhost:13579/test \
  JWT_SECRET=67d86ffae3c048121dd357fa668b576c8f08b4faf08a57405ded5deae9a7e8f1dec98d35f3bbf4284dbab00fe3341dbc45890baa4a7c5dcc83499ffafb8bd6bb \
  npm run start
```

The app should then be available at http://localhost:13577.

### Debugging

#### Client

Add the following entry in the local storage of your browser:

```
| Key   | Value     |
| ----- | --------- |
| debug | liaison:* |
```

#### Server

Add the following environment variables when starting the app:

```sh
DEBUG=liaison:* DEBUG_DEPTH=10
```

# To do

- Implement a test suite
