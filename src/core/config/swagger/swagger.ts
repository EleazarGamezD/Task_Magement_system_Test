import { SwaggerEnum } from '@enums/swagger.enums';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Sets up Swagger for the given Nest application.
 *
 * This function configures Swagger with a title, description, version, and tags
 * for the Task Management System API. It creates a Swagger document using the
 * provided application instance and configuration, and sets up Swagger UI with
 * custom CSS and JavaScript options.
 *
 * @param app - The Nest application instance to set up Swagger with.
 */
export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Task Management System')
    .setDescription(
      'The Task Management System API description. The Task Management System API allows you to create, read, update, and delete tasks.<br><br>' +
        '<a href="/api-docs-json" target="_blank" style="background-color: #49cc90; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-weight: bold;">Download Swagger JSON</a>' +
        '<h3>WebSocket Notifications</h3>' +
        '<p>Connect to WebSocket at: <code>ws://localhost:3000/notifications</code></p>' +
        '<table>' +
        '<tr><th>Event</th><th>Description</th><th>Payload</th></tr>' +
        '<tr><td>taskNotification</td><td>Emitted when a task is created, updated or deleted</td><td>Notification object</td></tr>' +
        '<tr><td>unreadCount</td><td>Emitted with the number of unread notifications</td><td>{ count: number }</td></tr>' +
        '</table>' +
        '<h4>Client Methods</h4>' +
        '<table>' +
        '<tr><th>Method</th><th>Description</th><th>Payload</th></tr>' +
        '<tr><td>markNotificationRead</td><td>Mark a notification as read</td><td>{ notificationId: string }</td></tr>' +
        '<tr><td>getNotifications</td><td>Get all notifications for current user</td><td>{}</td></tr>' +
        '</table>',
    )
    .setVersion(`${process.env.API_VERSION}`)
    .addTag('tasks', 'Operations related to tasks')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      SwaggerEnum.AUTH_TOKEN, // The name of the authorization header
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const swaggerCustomOptions = {
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
    ],
  };

  SwaggerModule.setup(`/`, app, document, swaggerCustomOptions);
}
