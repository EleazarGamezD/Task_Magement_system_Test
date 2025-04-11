import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('WebSocket Testing')
@Controller('ws-test')
export class WebSocketTestController {
  @Get()
  @ApiOperation({ summary: 'WebSocket Test Client' })
  getTestPage(@Res() res: Response) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>WebSocket Test Client</title>
      <style>
        body { font-family: Arial; margin: 20px; }
        #messages { border: 1px solid #ccc; padding: 10px; height: 300px; overflow-y: auto; }
        .controls { margin-top: 10px; }
        button { margin-right: 10px; }
        input { width: 300px; }
      </style>
    </head>
    <body>
      <h1>WebSocket Test Client</h1>
      <div>
        <label for="token">JWT Token:</label>
        <input type="text" id="token" style="width: 70%;" placeholder="Enter your JWT token here">
        <button onclick="connect()">Connect</button>
        <button onclick="disconnect()">Disconnect</button>
      </div>
      <h3>Notifications:</h3>
      <div id="messages"></div>
      <div class="controls">
        <h3>Actions:</h3>
        <div>
          <label for="notificationId">Notification ID:</label>
          <input type="text" id="notificationId" placeholder="Enter notification ID">
          <button onclick="markAsRead()">Mark as Read</button>
        </div>
        <div style="margin-top: 10px;">
          <button onclick="getNotifications()">Get All Notifications</button>
        </div>
      </div>

      <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
      <script>
        let socket;
        
        function appendMessage(message) {
          const messagesDiv = document.getElementById('messages');
          const messageDiv = document.createElement('div');
          messageDiv.innerHTML = '<strong>' + new Date().toLocaleTimeString() + ':</strong> ' + message;
          messagesDiv.appendChild(messageDiv);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        function connect() {
          const token = document.getElementById('token').value;
          if (!token) {
            appendMessage('Error: Token is required');
            return;
          }
          
          socket = io('http://localhost:3000/notifications', {
            auth: { token }
          });
          
          socket.on('connect', () => {
            appendMessage('Connected to server');
          });
          
          socket.on('disconnect', () => {
            appendMessage('Disconnected from server');
          });
          
          socket.on('taskNotification', (data) => {
            appendMessage('New task notification: ' + JSON.stringify(data));
          });
          
          socket.on('unreadCount', (data) => {
            appendMessage('Unread notifications: ' + data.count);
          });
          
          socket.on('connect_error', (error) => {
            appendMessage('Connection error: ' + error.message);
          });
        }
        
        function disconnect() {
          if (socket) {
            socket.disconnect();
            socket = null;
          }
        }
        
        function markAsRead() {
          if (!socket) {
            appendMessage('Error: Not connected');
            return;
          }
          
          const notificationId = document.getElementById('notificationId').value;
          if (!notificationId) {
            appendMessage('Error: Notification ID is required');
            return;
          }
          
          socket.emit('markNotificationRead', { notificationId }, (response) => {
            appendMessage('Mark as read response: ' + JSON.stringify(response));
          });
        }
        
        function getNotifications() {
          if (!socket) {
            appendMessage('Error: Not connected');
            return;
          }
          
          socket.emit('getNotifications', {}, (response) => {
            appendMessage('Get notifications response: ' + JSON.stringify(response));
          });
        }
      </script>
    </body>
    </html>
    `;

    res.set('Content-Type', 'text/html');
    return res.send(html);
  }
}
