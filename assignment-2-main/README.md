# Old Phone Deals
A web application for buying and selling used phones, developed with a Docker development environment.

## Project Overview
This project is a full-stack application built with a Express.js backend, a ReactJS frontend, and MongoDB database. The development environment was created using Docker for easy setup.

## Prerequisites
- Docker and Docker Compose. Docker Desktop can also be used.

## Project Structure
- **Root directory**: contains docker-compose.yml file.
- **Client directory**: contains frontend application, including its own Dockerile.
- **Server directory**: contains backend application, including its own Dockerfile.

### Backend (Express.js)
- Runs on port 3000.
- Follows MVC pattern.
- Utilizes JWT for authentication, cookie-parser for cookies, etc.
- API endpoints for phone listings, user authentication, etc.
- Connected to MongoDB database.

### Frontend (ReactJS)
- Runs on port 5173.
- Follows MVVM pattern.
- Utilizes MobX for state management, AntDesign for components, react-router for routing, etc.
- Communicates with the backend API
- Source code mounted into container for live reloading

### MongoDB Database

- Runs on port 27017
- Persists data in a Docker volume

## Getting Started

1. Clone the repository
2. Create a .env file in the root directory:
```
PORT=3000

CLIENT_URL=http://localhost:5173

#Database
MONGODB_URI=mongodb://mongodb:27017/old_phone_deals

NODE_ENV=developmentgit

#Email Configuration for sending registration info
EMAIL_USER=your_email
EMAIL_PASS=your_password

#Session Configuration
SESSION_SECRET=your_secret

#Admin
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_pw

#JWT
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRES_IN=2h
MONGO_URI=mongodb://mongodb:27017/old_phone_deals
JWT_SECRET=your_jwt_secret
``` 
3. Create a .env file in the frontend folder:
```
VITE_API_URL = http://localhost:3000
```
4. In order to change the initial data for the DB, in the /server/scripts folder. Phone listing should be called phonelisting.json and user listing should be called userlist.json
5. All photos should be placed in /server/public/images with name PhoneBrand.jpeg.
6. Run 'docker compose up' or use docker desktop for starting application.