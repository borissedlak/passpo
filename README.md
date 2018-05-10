# Setup

The application needs to be configured to be runnable on a Node.js server. Therefore the dependencies and all credentials that are required to run must be included.

The first step is to install all dependencies and external libraries to the project by executing `npm install` within the project over the commandline. This creates the */node_modules* folder within the project, where all required dependencies are included.

However, there are also packages recommended that are not included within the *package.json* file, which are not vital for the application. Executing `npm install -g nodemon npm-check` installs these packages to the global Node.js environment. 

## Environment variables

Applications secrets like the one for signing JWT tokens, the Facebook application credentials, and the MongoDB configuration params should not be included into the application's source code.

Therefore, it is necessary to configure server side variables in the Node.js hosting environment, which can be accessed over `process.env` in the source code. For testing the application, the credentials can either be hard-coded to the source code, or mocked by the process environment with the [dotenv](https://www.npmjs.com/package/dotenv) package.

## SSH certificates

It is considered a possible security threat of any third party knowing the application's SSH signature files. Any developer who reuses this application should replace the SSH key and server certificate in the */config* folder. For creating an SSL certificate, [Cygwin](https://cyberguerrilla.info/creating-an-ssl-certificate-with-cygwin/) can be used for Windows.

## MongoDB

To store data in a separate database, a MongoDB server is required to store configured Mongoose models.

[mLab](https://mlab.com/) is free to use for a specified amount of storage. After creating an account on the webpage, the MongoDB credentials (server path, username, password) need to be included over the server side environment

# Testing

The suggested Nodemon module eases the keep the Node server running during the testing. Executing `nodemon` within the project's folder runs the Node server and restarts the server on every code change, which simplifies testing. 

Any API testing tool is possible that allows the customization of the requests header and body. Within [Postman](https://www.getpostman.com/) a login request can be sent to the server that looks similar to `https://localhost:8443/auth/signup`.
The request's body must be sent in the `x-www-form-urlencoded` type and contain a username and password.

A successful login/signup request delivers a HTTP response with the stored user object, an info message, and the token that present the authentication assertion.

```json
{
    "user": {
		"_id": "5ae45fdac170c80c4036a367",
        "global": {
            "username": "Basta55",
            "registrationDate": "2018-04-28T11:49:46.331Z"
        },
        "local": {
            "password": "$2a$10$fGNy6ld5RENyLIt8Vbrn7.4GUrz5skgVqPghQ9y4LlL8aRM5KTtWq"
        }
    },
    "info": "User created",
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjp7Il9fdiI6MCwiX2lkIjoiNWFlNDVmZGFjMTcwYzgwYzQwMzZhMzY3IiwiZ2xvYmFsIjp7InVzZXJuYW1lIjoiQmFzdGE1NSIsInJlZ2lzdHJhdGlvbkRhdGUiOiIyMDE4LTA0LTI4VDExOjQ5OjQ2LjMzMVoifSwibG9jYWwiOnsicGFzc3dvcmQiOiIkMmEkMTAkZkdOeTZsZDVSRU55TEl0OFZicm43LjRHVXJ6NXNrZ1ZxUGdoUTl5NExsTDhhUk01S1R0V3EifX0sInN0cmF0ZWd5IjoibG9jYWwifQ.jaWLqojUmQHD2cwDUE48c6LjiTStyBCF08ryNH6Rbho"
}
```
The access token can be attached to a subsequent request to the API, the request looks similar to `https://localhost:8443/api/user`. Besides the token, the desired authentication strategy must be specified in the HTTP header's `strategy` property, which is `local` for this method and `facebook` for the Facebook strategy.

The request return an HTTP body that contains all user objects that were inserted to the MongoDB. 

```json
[
    {
        "_id": "5ac8d24715e0fd1660023765",
        "global": {
            "email": "bsedlak01@gmail.com",
            "registrationDate": "2018-04-07T14:14:31.263Z"
        },
        "facebook": {
            "facebookId": 1903858452962646
        }
    },
    {
        "_id": "5ae45fdac170c80c4036a367",
        "global": {
            "username": "Basta55",
            "registrationDate": "2018-04-28T11:49:46.331Z"
        },
        "local": {
            "password": "$2a$10$fGNy6ld5RENyLIt8Vbrn7.4GUrz5skgVqPghQ9y4LlL8aRM5KTtWq"
        }
    }
]
```

# Development

## File Structure

+ *./config* contains the configuration of contant variables and the SSH signature files
+ *./models* includes all the configured Mongoose models for performing operation to MongoDB
- *./modules/authenticator.js* contains the authentication middleware for validating incoming tokens
- *./modules/passport.js* contains the Passport strategies for user authentication
- *./modules/storage.js* describes the setup for the MongoDB connection
+ *./routing* Includes all application routers that are implemented in server.js
+ *server.js* Facilitates the wrapper around the whole application

## Hands on
### First steps
1. The connection to MongoDB must be configured within the storage module
2. New signature files must be added to the config folder

### Following steps
1. To create a customizer API, own models can be added to Mongoose to store different object types. 
2. The validation process can be customized within the authenticator module
3. Authentication with additional Passport strategies or configuring new strategies is done within the passport module.
4. The API endpoint need to be configured and extended in the authentication routes module
4. General functions can be added to the util module