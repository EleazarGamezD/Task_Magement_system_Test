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
        '<br><br><a href="/api/V1/ws-test" target="_blank" style="background-color: #6366f1; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-weight: bold;">Open WebSocket Test Client</a>' +
        '<h3>WebSocket Notifications</h3>' +
        '<p>Connect to Socket.IO at: <code>http://localhost:3000/notifications</code></p>' +
        '<h4>Available WebSocket Events</h4>' +
        '<table style="width:100%; border-collapse: collapse; margin-bottom: 15px;">' +
        '<tr style="background-color: #f8f9fa;"><th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Direction</th><th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Event Name</th><th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Description</th></tr>' +
        '<tr><td style="padding: 8px; border: 1px solid #dee2e6;">Client → Server</td><td style="padding: 8px; border: 1px solid #dee2e6;"><code>subscribeToNotifications</code></td><td style="padding: 8px; border: 1px solid #dee2e6;">Subscribe to receive notifications</td></tr>' +
        '<tr><td style="padding: 8px; border: 1px solid #dee2e6;">Client → Server</td><td style="padding: 8px; border: 1px solid #dee2e6;"><code>getNotifications</code></td><td style="padding: 8px; border: 1px solid #dee2e6;">Retrieve all notifications for the user</td></tr>' +
        '<tr><td style="padding: 8px; border: 1px solid #dee2e6;">Client → Server</td><td style="padding: 8px; border: 1px solid #dee2e6;"><code>markAsRead</code></td><td style="padding: 8px; border: 1px solid #dee2e6;">Mark a notification as read</td></tr>' +
        '<tr><td style="padding: 8px; border: 1px solid #dee2e6;">Server → Client</td><td style="padding: 8px; border: 1px solid #dee2e6;"><code>NEW_TASK</code></td><td style="padding: 8px; border: 1px solid #dee2e6;">Notification when a new task is created</td></tr>' +
        '<tr><td style="padding: 8px; border: 1px solid #dee2e6;">Server → Client</td><td style="padding: 8px; border: 1px solid #dee2e6;"><code>UPDATE_TASK</code></td><td style="padding: 8px; border: 1px solid #dee2e6;">Notification when a task is updated</td></tr>' +
        '<tr><td style="padding: 8px; border: 1px solid #dee2e6;">Server → Client</td><td style="padding: 8px; border: 1px solid #dee2e6;"><code>DELETE_TASK</code></td><td style="padding: 8px; border: 1px solid #dee2e6;">Notification when a task is deleted</td></tr>' +
        '<tr><td style="padding: 8px; border: 1px solid #dee2e6;">Server → Client</td><td style="padding: 8px; border: 1px solid #dee2e6;"><code>taskNotification</code></td><td style="padding: 8px; border: 1px solid #dee2e6;">General task notification channel</td></tr>' +
        '<tr><td style="padding: 8px; border: 1px solid #dee2e6;">Server → Client</td><td style="padding: 8px; border: 1px solid #dee2e6;"><code>unreadCount</code></td><td style="padding: 8px; border: 1px solid #dee2e6;">Number of unread notifications</td></tr>' +
        '</table>' +
        '<p>Use the following code to connect with Socket.IO:</p>' +
        '<pre><code>// Include the Socket.IO client library\n' +
        '// &lt;script src="https://cdn.socket.io/4.5.4/socket.io.min.js">&lt;/script>\n\n' +
        'const socket = io("http://localhost:3000/notifications", {\n' +
        '  auth: { token: "YOUR_JWT_TOKEN" },\n' +
        '  transports: ["websocket"]\n' +
        '});\n\n' +
        'socket.on("connect", () => {\n' +
        '  console.log("Connected to notification server");\n' +
        '  \n' +
        '  // Subscribe to notifications\n' +
        '  socket.emit("subscribeToNotifications", {});\n' +
        '});\n\n' +
        '// Listen for task notifications\n' +
        'socket.on("NEW_TASK", (data) => {\n' +
        '  console.log("New task notification:", data);\n' +
        '});\n\n' +
        'socket.on("unreadCount", (data) => {\n' +
        '  console.log("Unread notifications:", data.count);\n' +
        '});</code></pre>',
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

  SwaggerModule.setup(`/api-docs`, app, document, swaggerCustomOptions);
}
