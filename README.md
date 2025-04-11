<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </p>

  <h1 align="center">Task Management System</h1>

  <p align="center">
    A comprehensive task management system built with NestJS, featuring real-time notifications, user authentication, and role-based access control.
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Task-Management-blue" alt="Task Management" />
    <img src="https://img.shields.io/badge/NestJS-Framework-red" alt="NestJS Framework" />
    <img src="https://img.shields.io/badge/WebSockets-Real--time-green" alt="WebSockets Real-time" />
    <img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" />
  </p>

  ---

  ## 📋 Overview

  This Task Management System provides a robust API to create, read, update, and delete tasks. It includes user authentication, file uploads, real-time notifications via WebSockets, and comprehensive API documentation.

  ---

  ## 🚀 Features

  - **User Authentication**: Register, login, refresh tokens, and profile management.
  - **Task Management**: CRUD operations for tasks with file attachments.
  - **Real-time Notifications**: WebSockets for instant task updates.
  - **Role-based Access Control**: Different permissions for admins and users.
  - **API Documentation**: Interactive Swagger documentation.
  - **File Uploads**: Support for profile photos and task attachments.

  ---

  ## 🛠️ Installation

  ```bash
  # Clone the repository
  git clone https://github.com/EleazarGamezD/Task_Magement_system_Test.git

  # Navigate to the project directory
  cd Task_Magement_system_Test

  # Install dependencies
  yarn install

  # Setup environment variables
  cp .env.example .env
  # Edit the .env file with your configuration

  # Start the database using Docker
  docker-compose up -d

  # Run database migrations
  yarn db:sync

  # Seed the database
  yarn seed:run

  # Start the application
  yarn start:dev
  ```

  ### 🗄️ Database Setup

  The project uses TypeORM for database management. Configure your database connection in the `.env` file:
  
  ```env
  # Server basic configuration
  APP_NAME="Your Application Name"
  PORT=YourPortNumber
  API_VERSION="YourAPIVersion"
  NODE_ENV=YourEnvironment # e.g., production, development

  # Auth Configuration
  JWT_SECRET="YourJWTSecret"
  JWT_EXPIRATION='YourJWTExpirationTime'
  JWT_REFRESH_EXPIRATION='YourJWTRefreshExpirationTime'

  # Postgres Configuration
  DB_HOST=YourDatabaseHost
  DB_PORT=YourDatabasePort
  DB_USER=YourDatabaseUser
  DB_PASS=YourDatabasePassword
  DB_NAME=YourDatabaseName
  DB_SSL=YourDatabaseSSLSetting
  BD_TYPEORM_LOGGING=YourTypeORMLoggingSetting
  STAGE=YourStage
  DB_CONTAINER=YourDatabaseContainerName

  # Minio Configuration
  MINIO_PORT=YourMinioPort
  MINIO_ENDPOINT=YourMinioEndpoint
  MINIO_USE_SSL=YourMinioSSLSetting
  MINIO_USER=YourMinioUser
  MINIO_PASSWORD=YourMinioPassword
  MINIO_BUCKET=YourMinioBucketName
  MINIO_REGION=YourMinioRegion
  ```

  #### Migrations

  ```bash
  # Drop the Database
  yarn db:drop

  # Sync the Entities whit Database (develop purposes)
  yarn db:sync

  # Seed the Database
  yarn db:seed

  # Reset the Database, this command execute all tree commands at time 
  yarn db:reset
  ```

  #### Seed Data

  To populate your database with initial data:

  ```bash
  yarn db:seed
  ```

### Default Users

When you run the database seed, the following default users are created:

| User Type      | Email                | Password     | Username     | Role  | Permissions                                      |
|----------------|----------------------|--------------|--------------|-------|-------------------------------------------------|
| Administrator  | admin@example.com   | Admin123     | adminuser    | ADMIN | READ_ALL_TASK, UPDATE_ALL_TASK, DELETE_ALL_TASK |
| Regular User   | user@example.com    | Password123  | regularuser  | USER  | CREATE_OWN_TASK, READ_OWN_TASK, UPDATE_OWN_TASK, DELETE_OWN_TASK, READ_ALL_OWN_TASK |
  ---

  ## 📊 API Documentation

  The API documentation is available via Swagger UI when the application is running:

  - **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
  - **OpenAPI JSON**: [http://localhost:3000/api-docs-json](http://localhost:3000/api-docs-json)

  ---

  ## 📱 WebSocket Notifications

  The application includes real-time notifications via WebSockets. A test client is available at:

  - **WebSocket Test Client**: [http://localhost:3000/api/V1/ws-test](http://localhost:3000/api/V1/ws-test)

  ### WebSocket Events

  | Direction       | Event Name               | Description                              |
  |-----------------|--------------------------|------------------------------------------|
  | Client → Server | `subscribeToNotifications` | Subscribe to receive notifications       |
  | Client → Server | `getNotifications`        | Retrieve all notifications for the user  |
  | Client → Server | `markAsRead`              | Mark a notification as read              |
  | Server → Client | `NEW_TASK`                | Notification when a new task is created  |
  | Server → Client | `UPDATE_TASK`             | Notification when a task is updated      |
  | Server → Client | `DELETE_TASK`             | Notification when a task is deleted      |
  | Server → Client | `taskNotification`        | General task notification channel        |
  | Server → Client | `unreadCount`             | Number of unread notifications           |

  ---

  ## 🧪 Testing with Postman

  A comprehensive Postman collection is included in the project for testing all API endpoints.

  ### Collection Location

  The Postman collection is located at:

  `src/core/tools/postman/Task Management System.postman_collection.json`

  ### Importing into Postman

  1. Open Postman.
  2. Click the "Import" button.
  3. Select the collection file from the location above.

  ---

  ## 📁 Project Structure

  ```plaintext
  src/
  ├── app.module.ts            # Main application module
  ├── main.ts                  # Application entry point
  ├── core/                    # Core functionality
  │   ├── config/              # Configuration settings
  │   ├── constants/           # Application constants
  │   ├── enums/               # Enumeration types
  │   ├── tools/               # Utility tools including Postman collection
  │   └── utils/               # Utility functions
  ├── modules/                 # Feature modules
  │   ├── auth/                # Authentication module
  │   ├── shared/              # Shared functionality
  |   |   └── database/        # Database configuration
  |   |   └── files/           # File Services
  │   │   └── notification/    # WebSocket notifications
  │   └── task/                # Task management module
  ```

  ---

  ## 🔑 API Endpoints

  ### Authentication

  - `POST /api/V1/auth/register` - Register a new user.
  - `POST /api/V1/auth/login` - Login.
  - `POST /api/V1/auth/refresh` - Refresh JWT token.
  - `DELETE /api/V1/auth/logout` - Logout.
  - `PATCH /api/V1/auth/user` - Update user information.
  - `GET /api/V1/auth/profile` - Get user profile.

  ### Task Management

  - `POST /api/V1/tasks/create` - Create a new task.
  - `GET /api/V1/tasks/all` - Get all tasks with pagination.
  - `GET /api/V1/tasks/get/:id` - Get a task by ID.
  - `PATCH /api/V1/tasks/update/:id` - Update a task.
  - `DELETE /api/V1/tasks/delete/:id` - Delete a task.

  ---

  ## 👨‍💻 Development

  ```bash
 # Install dependencies
  yarn install

  # Setup environment variables
  cp .env.example .env
  # Edit the .env file with your configuration

  # Start the database using Docker
  docker-compose up -d

  # Run database migrations
  yarn db:reset 

  # Seed the database
  yarn seed:run

  # Start the application
  yarn start:dev
  ```

  ---

  ## 📄 License

  This project is licensed under the MIT License - see the LICENSE file for details.

  ---
## 👤 Author NOTE
  **I dont make a unit testing because i don´t how to make it**

  ## 👤 Author

  **Eleazar Gamez**  
  [GitHub Profile](https://github.com/EleazarGamezD)