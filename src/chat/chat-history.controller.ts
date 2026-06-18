import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat/history')
export class ChatHistoryController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':sessionId')
  async history(@Param('sessionId') sessionId: string) {
    return this.chatService.getChatHistory(sessionId);
  }
}

