import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: true, credentials: true } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[NotificationsGateway] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[NotificationsGateway] Client disconnected: ${client.id}`);
  }

  // Clients join a room specifically named 'user_USERID'
  @SubscribeMessage('join_notifications')
  handleJoinNotifications(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const { userId } = data;
    if (userId) {
      client.join(`user_${userId}`);
      console.log(`[NotificationsGateway] Socket ${client.id} joined room user_${userId}`);
    }
  }

  /**
   * Push a notification payload exactly to the specified recipient user IDs.
   */
  emitToRecipients(recipientUserIds: string[], payload: any) {
    recipientUserIds.forEach(userId => {
      this.server.to(`user_${userId}`).emit('new_notification', payload);
    });
  }
}
