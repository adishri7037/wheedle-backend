import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LiveChatGateway } from './live-chat.gateway';
import { LiveChatService } from './live-chat.service';
import { LiveChatController } from './live-chat.controller';
import { LiveChat, LiveChatSchema } from '../schemas/live-chat.schema';
import { LiveLead, LiveLeadSchema } from '../schemas/live-lead.schema';
import { LiveSupport, LiveSupportSchema } from '../schemas/live-support.schema';
import { ChatSession, ChatSessionSchema } from '../schemas/chat-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LiveChat.name, schema: LiveChatSchema },
      { name: LiveLead.name, schema: LiveLeadSchema },
      { name: LiveSupport.name, schema: LiveSupportSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
    ]),
  ],
  providers: [LiveChatGateway, LiveChatService],
  controllers: [LiveChatController],
})
export class LiveChatModule {}

