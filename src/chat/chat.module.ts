import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatHistoryController } from './chat-history.controller';

import { Chat, ChatSchema } from '../schemas/chat.schema';
import { UserContact, UserContactSchema } from '../schemas/user-contact.schema';
import { ChatSession, ChatSessionSchema } from '../schemas/chat-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: UserContact.name, schema: UserContactSchema },
    ]),
  ],
  controllers: [ChatController, ChatHistoryController],
  providers: [ChatService],
})
export class ChatModule {}

