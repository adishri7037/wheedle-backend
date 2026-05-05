import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LiveChat } from '../schemas/live-chat.schema';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class LiveChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @InjectModel(LiveChat.name) private liveChatModel: Model<LiveChat>,
  ) {
    console.log('[LiveChatGateway] Initialized');
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const { chat_id, role = 'user' } = data;
    if (!chat_id) return;

    client.join(chat_id);
    console.log(`[SOCKET] ${role} joined room: ${chat_id}`);

    client.broadcast.to(chat_id).emit('user_joined', {
      chat_id,
      role,
      sid: client.id,
    });

    if (role === 'agent') {
      try {
        await this.liveChatModel.findByIdAndUpdate(chat_id, { agent_joined: true }).exec();
      } catch (e) {}
      client.broadcast.to(chat_id).emit('agent_connected', {
        chat_id,
        ts: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('leave_chat')
  handleLeaveChat(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const { chat_id } = data;
    if (chat_id) {
      client.leave(chat_id);
      console.log(`[SOCKET] Client left room: ${chat_id}`);
    }
  }

  @SubscribeMessage('user_message')
  async handleUserMessage(@MessageBody() data: any) {
    const { chat_id, text = '', image = null, file = null } = data;
    if (!chat_id) return;

    const msg = {
      sender: 'user',
      text,
      image,
      file,
      ts: new Date().toISOString(),
    };

    try {
      await this.liveChatModel.findByIdAndUpdate(chat_id, {
        $push: { messages: msg },
        $set: { updatedAt: new Date() },
      }).exec();
    } catch (e) {
      console.error(`[SOCKET] DB error user_message:`, e);
    }

    this.server.to(chat_id).emit('new_message', {
      chat_id,
      sender: 'user',
      text,
      image,
      file,
      ts: msg.ts,
    });
  }

  @SubscribeMessage('agent_message')
  async handleAgentMessage(@MessageBody() data: any) {
    const { chat_id, text = '', image = null, file = null } = data;
    if (!chat_id) return;

    const msg = {
      sender: 'agent',
      text,
      image,
      file,
      ts: new Date().toISOString(),
    };

    try {
      await this.liveChatModel.findByIdAndUpdate(chat_id, {
        $push: { messages: msg },
        $set: { updatedAt: new Date(), agent_joined: true },
      }).exec();
    } catch (e) {
      console.error(`[SOCKET] DB error agent_message:`, e);
    }

    this.server.to(chat_id).emit('new_message', {
      chat_id,
      sender: 'agent',
      text,
      image,
      file,
      ts: msg.ts,
    });
  }

  @SubscribeMessage('agent_join')
  async handleAgentJoin(@MessageBody() data: any) {
    const { chat_id } = data;
    if (!chat_id) return;

    try {
      await this.liveChatModel.findByIdAndUpdate(chat_id, { agent_joined: true }).exec();
    } catch (e) {}

    this.server.to(chat_id).emit('agent_connected', {
      chat_id,
      ts: new Date().toISOString(),
    });
  }

  @SubscribeMessage('close_chat')
  async handleCloseChat(@MessageBody() data: any) {
    const { chat_id } = data;
    if (!chat_id) return;

    try {
      await this.liveChatModel.findByIdAndUpdate(chat_id, {
        status: 'closed',
        updatedAt: new Date(),
      }).exec();
    } catch (e) {}

    this.server.to(chat_id).emit('chat_closed', {
      chat_id,
      ts: new Date().toISOString(),
    });
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const { chat_id, role = 'user', is_typing = false } = data;
    if (!chat_id) return;

    client.broadcast.to(chat_id).emit('typing', {
      chat_id,
      role,
      is_typing,
    });
  }

  emitNewChat(data: any) {
    this.server.emit('new_chat', data);
  }

  emitChatClosed(data: any) {
    this.server.emit('chat_closed', data);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
