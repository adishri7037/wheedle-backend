import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class ClientQueriesGateway {
  @WebSocketServer()
  server: Server;

  constructor() {
    console.log('[ClientQueriesGateway] Initialized');
  }

  @SubscribeMessage('join_query')
  handleJoinQuery(@MessageBody() data: { queryId: string }, @ConnectedSocket() client: Socket) {
    if (data && data.queryId) {
      client.join(data.queryId);
      console.log(`[SOCKET] Client joined query room: ${data.queryId}`);
    }
  }

  @SubscribeMessage('leave_query')
  handleLeaveQuery(@MessageBody() data: { queryId: string }, @ConnectedSocket() client: Socket) {
    if (data && data.queryId) {
      client.leave(data.queryId);
      console.log(`[SOCKET] Client left query room: ${data.queryId}`);
    }
  }

  notifyQueryUpdate(queryId: string, query: any) {
    if (this.server) {
      this.server.to(queryId).emit('query_updated', query);
    }
  }
}
