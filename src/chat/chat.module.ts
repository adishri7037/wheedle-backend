import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Chat, ChatSchema } from '../schemas/chat.schema';
import { UserContact, UserContactSchema } from '../schemas/user-contact.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: UserContact.name, schema: UserContactSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService]
})
export class ChatModule {}
