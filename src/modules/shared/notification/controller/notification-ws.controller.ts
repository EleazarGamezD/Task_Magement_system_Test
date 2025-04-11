import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('WebSocket Testing')
@Controller('ws-test')
export class WebSocketTestController {
  @Get()
  @ApiOperation({
    summary: 'WebSocket Test Client',
    description:
      '<a href="/api/V1/ws-test" target="_blank" class="swagger-ui-btn">Open WebSocket Test Client in New Tab</a><style>.swagger-ui-btn{background-color: #49cc90; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 10px;}</style>',
  })
  getTestPage(@Res() res: Response) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>WebSocket Test Client</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        :root {
          --primary-color: #2563eb;
          --primary-hover: #1d4ed8;
          --bg-color: #f8fafc;
          --border-color: #e2e8f0;
          --text-color: #334155;
          --heading-color: #1e293b;
          --success-color: #10b981;
          --warning-color: #f59e0b;
          --error-color: #ef4444;
          --info-color: #3b82f6;
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: var(--text-color);
          background-color: var(--bg-color);
          padding: 20px;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 30px;
        }
        
        h1, h3 {
          color: var(--heading-color);
          margin-bottom: 20px;
          text-align: center;
        }
        
        h1 {
          font-size: 28px;
          border-bottom: 2px solid var(--primary-color);
          padding-bottom: 10px;
          margin-bottom: 30px;
        }
        
        h3 {
          font-size: 20px;
          margin-top: 30px;
        }
        
        .connection-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 25px;
        }
        
        .token-group {
          display: flex;
          gap: 10px;
        }
        
        .button-group {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 10px;
        }
        
        label {
          font-weight: 600;
          display: block;
          margin-bottom: 8px;
        }
        
        input {
          padding: 10px 15px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 16px;
          width: 100%;
          transition: border 0.3s ease;
        }
        
        input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        
        button {
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        button:hover {
          background-color: var(--primary-hover);
        }
        
        #messages {
          height: 400px;
          overflow-y: auto;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 15px;
          background-color: #f8fafc;
          margin-bottom: 25px;
        }
        
        #messages div {
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #edf2f7;
        }
        
        #messages div:last-child {
          border-bottom: none;
        }
        
        .message-time {
          color: var(--primary-color);
          font-weight: 600;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }
        
        .status-connected {
          background-color: var(--success-color);
        }
        
        .status-disconnected {
          background-color: var(--error-color);
        }
        
        .notification-card {
          background-color: white;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 15px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          border-left: 4px solid var(--info-color);
        }
        
        .notification-title {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 5px;
        }
        
        .notification-message {
          margin-bottom: 8px;
        }
        
        .notification-meta {
          font-size: 12px;
          color: #64748b;
        }
        
        .notification-type-NEW_TASK {
          border-left-color: var(--info-color);
        }
        
        .notification-type-UPDATE_TASK {
          border-left-color: var(--warning-color);
        }
        
        .notification-type-DELETE_TASK {
          border-left-color: var(--error-color);
        }
        
        .notification-read {
          opacity: 0.7;
        }
        
        .controls {
          background-color: #f1f5f9;
          padding: 20px;
          border-radius: 6px;
        }
        
        .action-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .connection-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 10px;
          font-weight: 600;
        }
        
        .connection-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: var(--error-color);
        }
        
        .connection-indicator.connected {
          background-color: var(--success-color);
        }
        
        .unread-counter {
          display: inline-block;
          background-color: var(--primary-color);
          color: white;
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 14px;
          font-weight: 600;
          margin-left: 10px;
        }
        
        .json-formatter {
          background-color: #f8fafc;
          border-radius: 4px;
          padding: 10px;
          font-family: monospace;
          white-space: pre-wrap;
          font-size: 13px;
          overflow: auto;
          max-height: 200px;
        }
        
        @media (max-width: 600px) {
          .token-group, .action-group {
            flex-direction: column;
          }
          
          .button-group {
            flex-direction: column;
            width: 100%;
          }
          
          button {
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>WebSocket Test Client</h1>
        
        <div class="connection-form">
          <div>
            <label for="token">JWT Token:</label>
            <div class="token-group">
              <input type="text" id="token" placeholder="Enter your JWT token here">
            </div>
          </div>
          <div class="button-group">
            <button onclick="connect()">Connect</button>
            <button onclick="disconnect()" style="background-color: #ef4444;">Disconnect</button>
            <button onclick="emitTestEvent()" style="background-color: #6366f1;">Test Connection</button>
          </div>
          <div class="connection-status">
            Status: 
            <div class="connection-indicator" id="connectionIndicator"></div>
            <span id="connectionStatus">Disconnected</span>
            <span id="unreadCounter" class="unread-counter" style="display: none;">0</span>
          </div>
        </div>
        
        <h3>Notifications</h3>
        <div id="messages"></div>
        
        <div class="controls">
          <h3>Actions</h3>
          <div class="action-group">
            <div style="flex: 1;">
              <label for="notificationId">Notification ID:</label>
              <input type="text" id="notificationId" placeholder="Enter notification ID">
            </div>
            <button onclick="markAsRead()">Mark as Read</button>
          </div>
          <button onclick="getNotifications()" style="width: 100%;">Get All Notifications</button>
          <div style="margin-top: 15px;">
            <button onclick="testNotification()" style="width: 100%; background-color: #8b5cf6;">
              Simular Notificación
            </button>
          </div>
        </div>
      </div>

      <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
      <script>
        let socket;
        let unreadCount = 0;
        
        function formatJson(obj) {
          try {
            return JSON.stringify(obj, null, 2);
          } catch (e) {
            return String(obj);
          }
        }
        
        function formatTimestamp(timestamp) {
          if (!timestamp) return '';
          try {
            const date = new Date(timestamp);
            return date.toLocaleString();
          } catch (e) {
            return timestamp;
          }
        }
        
        function updateConnectionStatus(isConnected) {
          const indicator = document.getElementById('connectionIndicator');
          const status = document.getElementById('connectionStatus');
          
          if (isConnected) {
            indicator.classList.add('connected');
            status.textContent = 'Connected';
          } else {
            indicator.classList.remove('connected');
            status.textContent = 'Disconnected';
            document.getElementById('unreadCounter').style.display = 'none';
          }
        }
        
        function updateUnreadCounter(count) {
          unreadCount = count;
          const counter = document.getElementById('unreadCounter');
          counter.textContent = count;
          counter.style.display = count > 0 ? 'inline-block' : 'none';
        }
        
        function appendMessage(message) {
          const messagesDiv = document.getElementById('messages');
          const messageDiv = document.createElement('div');
          messageDiv.innerHTML = '<span class="message-time">' + new Date().toLocaleTimeString() + ':</span> ' + message;
          messagesDiv.appendChild(messageDiv);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        function appendErrorMessage(message) {
          appendMessage('<span style="color: var(--error-color);"><strong>Error:</strong> ' + message + '</span>');
        }
        
        function appendSystemMessage(message) {
          appendMessage('<span style="color: var(--primary-color);"><strong>System:</strong> ' + message + '</span>');
        }
        
        function appendNotification(notification) {
          console.log('Notification object received:', notification);
          
          let readStatus = notification.read ? ' (Read)' : ' <strong>(Unread)</strong>';
          let message = \`
    <div class="notification-card \${notification.read ? 'notification-read' : ''} notification-type-\${notification.type || 'DEFAULT'}">
      <div class="notification-title">\${notification.title || 'Notification'}\${readStatus}</div>
      <div class="notification-message">\${notification.message || ''}</div>
      <div class="notification-meta">
        <div>ID: <code>\${notification.id || '(no id)'}</code></div>
        <div>Type: <code>\${notification.type || '(no type)'}</code></div>
        <div>Created: <code>\${formatTimestamp(notification.createdAt || notification.timestamp)}</code></div>
        <div>Source: <code>\${notification._sourceEvent || 'direct'}</code></div>
      </div>
    </div>
          \`;
          appendMessage(message);
        }
        
        function renderNotificationList(notifications) {
          if (!notifications || !Array.isArray(notifications)) {
            appendErrorMessage('Invalid notifications data');
            return;
          }
          
          if (notifications.length === 0) {
            appendSystemMessage('No notifications found');
            return;
          }
          
          appendSystemMessage('Displaying ' + notifications.length + ' notifications:');
          
          for (const notification of notifications) {
            appendNotification(notification);
          }
        }
        
        function playNotificationSound() {
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAA=');
            audio.play();
          } catch (e) {
          }
        }
        
        function connect() {
          const token = document.getElementById('token').value;
          if (!token) {
            appendErrorMessage('Token is required');
            return;
          }
          
          appendSystemMessage('Connecting...');
          
          try {
            socket = io('http://localhost:3000/notifications', {
              auth: { token },
              transports: ['websocket']
            });
            
            socket.on('connect', () => {
              updateConnectionStatus(true);
              appendSystemMessage('Connected to server with ID: ' + socket.id);
              
              socket.emit('subscribeToNotifications', {}, (response) => {
                if (response && response.success) {
                  appendSystemMessage('Successfully subscribed to notifications!');
                } else {
                  const errorMsg = response && response.error ? response.error : 'Unknown error';
                  appendSystemMessage('Subscription status: ' + errorMsg);
                }
              });
              
              const notificationTypes = ['NEW_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'TASK_ASSIGNED'];
              notificationTypes.forEach(type => {
                socket.on(type, (data) => {
                  appendSystemMessage(\`★ NOTIFICACIÓN DE TIPO \${type} RECIBIDA ★\`);
                  appendMessage(\`<pre class="json-formatter">\${formatJson(data)}</pre>\`);
                  appendNotification(data);
                  playNotificationSound();
                });
              });
            });

            socket.on('taskNotification', (data) => {
              appendSystemMessage(\`★ NUEVA NOTIFICACIÓN RECIBIDA ★\`);
              appendMessage(\`<pre class="json-formatter">\${formatJson(data)}</pre>\`);
              
              if (data) {
                appendNotification(data);
                playNotificationSound();
              } else {
                appendErrorMessage('Notificación recibida con formato inválido');
              }
            });
            
            socket.on('unreadCount', (data) => {
              updateUnreadCounter(data.count);
              appendSystemMessage('Notificaciones sin leer: ' + data.count);
            });
            
            socket.on('connect_error', (error) => {
              updateConnectionStatus(false);
              appendErrorMessage('Error de conexión: ' + error.message);
            });
            
            socket.on('disconnect', (reason) => {
              updateConnectionStatus(false);
              appendSystemMessage('Desconectado del servidor. Razón: ' + reason);
            });
            
            socket.onAny((eventName, ...args) => {
              if (eventName !== 'unreadCount') {
                appendMessage('<div style="padding: 8px; background-color: #f8fafc; border-left: 3px solid #64748b; margin: 8px 0;"><strong>Evento recibido:</strong> ' + eventName + '</div>');
              }
            });
          } catch (error) {
            appendErrorMessage('Failed to initialize socket: ' + error.message);
          }
        }
        
        function disconnect() {
          if (socket) {
            socket.disconnect();
            socket = null;
            updateConnectionStatus(false);
            appendSystemMessage('Manually disconnected from server');
          } else {
            appendErrorMessage('Not connected to any server');
          }
        }
        
        function markAsRead() {
          if (!socket) {
            appendErrorMessage('Not connected');
            return;
          }
          
          const notificationId = document.getElementById('notificationId').value;
          if (!notificationId) {
            appendErrorMessage('Notification ID is required');
            return;
          }
          
          appendSystemMessage('Marking notification as read: ' + notificationId);
          
          socket.emit('markNotificationRead', { notificationId }, (response) => {
            if (response && response.success) {
              appendSystemMessage('Successfully marked notification as read');
              if (response.notification) {
                appendNotification(response.notification);
              }
            } else {
              const errorMsg = response && response.error ? response.error : 'Unknown error';
              appendErrorMessage('Failed to mark notification as read: ' + errorMsg);
            }
          });
        }
        
        function getNotifications() {
          if (!socket) {
            appendErrorMessage('Not connected');
            return;
          }
          
          appendSystemMessage('Fetching all notifications...');
          
          socket.emit('getNotifications', {}, (response) => {
            if (response && response.success) {
              renderNotificationList(response.notifications);
            } else {
              const errorMsg = response && response.error ? response.error : 'Unknown error';
              appendErrorMessage('Failed to fetch notifications: ' + errorMsg);
            }
          });
        }
        
        function emitTestEvent() {
          if (!socket) {
            appendErrorMessage('Not connected');
            return;
          }
          
          socket.emit('getNotifications', {}, (response) => {
            if (response && response.success) {
              appendSystemMessage('Test event successful, notifications received');
              renderNotificationList(response.notifications);
            } else {
              const errorMsg = response && response.error ? response.error : 'Unknown error';
              appendErrorMessage('Test event failed: ' + errorMsg);
            }
          });
        }
        
        function testNotification() {
          if (!socket) {
            appendErrorMessage('Not connected');
            return;
          }
          
          const mockNotification = {
            id: 'test-' + Date.now(),
            type: 'NEW_TASK',
            title: 'Test Notification',
            message: 'This is a test notification generated locally',
            createdAt: new Date().toISOString(),
            read: false,
            _sourceEvent: 'testNotification',
            timestamp: new Date().toISOString()
          };
          
          appendSystemMessage('Simulando notificación recibida:');
          appendNotification(mockNotification);
          playNotificationSound();
        }
        
        updateConnectionStatus(false);
      </script>
    </body>
    </html>
    `;

    res.set('Content-Type', 'text/html');
    return res.send(html);
  }
}
