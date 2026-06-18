import { Controller, Post, Get, Body, Query, Headers, Req, UnauthorizedException, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { FindByPhoneDto } from './dto/find-by-phone.dto';


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

  @Get('history/:sessionId')
  async getHistoryBySession(@Param('sessionId') sessionId: string) {
    return this.chatService.getChatHistory(sessionId);
  }

  @Post('find-by-phone')
  async findByPhone(
    @Body() body: FindByPhoneDto,
    @Headers('x-api-key') apiKey: string,
  ) {
    const expectedKey = this.configService.get<string>('API_KEY_SECRET');
    if (apiKey !== expectedKey) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.chatService.findSessionsByPhone(body.phone);
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
