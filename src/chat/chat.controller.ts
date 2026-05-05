import { Controller, Post, Get, Body, Query, Headers, Req, UnauthorizedException } from '@nestjs/common';
import { ChatService } from './chat.service';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private configService: ConfigService,
  ) {}

  @Get('history')
  async getHistory(@Query('sessionId') sessionId: string) {
    return this.chatService.getChatHistory(sessionId);
  }

  @Post()
  async chat(
    @Body() body: any,
    @Headers('x-api-key') apiKey: string,
    @Req() req: Request,
  ) {
    const expectedKey = this.configService.get<string>('API_KEY_SECRET');
    if (apiKey !== expectedKey) {
      throw new UnauthorizedException('Unauthorized');
    }

    const { message, sessionId, userId } = body;
    const ip = req.ip;
    return this.chatService.askAI(sessionId, message, userId, ip);
  }
}
