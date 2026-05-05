import { Controller, Post, Get, Patch, Body, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { LiveChatService } from './live-chat.service';
import { ConfigService } from '@nestjs/config';

@Controller('live')
export class LiveChatController {
  constructor(
    private liveChatService: LiveChatService,
    private configService: ConfigService,
  ) {}

  private validateApiKey(apiKey: string) {
    const expectedKey = this.configService.get<string>('API_KEY_SECRET');
    if (apiKey !== expectedKey) {
      throw new UnauthorizedException('Unauthorized');
    }
  }

  @Post('new-user-lead')
  async createLead(@Body() body: any, @Headers('x-api-key') apiKey: string) {
    this.validateApiKey(apiKey);
    return this.liveChatService.createLead(body);
  }

  @Post('client-support')
  async createSupport(@Body() body: any, @Headers('x-api-key') apiKey: string) {
    this.validateApiKey(apiKey);
    return this.liveChatService.createSupport(body);
  }

  @Get('chats')
  async findAll() {
    return this.liveChatService.findAll();
  }

  @Get('chats/:id')
  async findOne(@Param('id') id: string) {
    return this.liveChatService.findOne(id);
  }

  @Patch('chats/:id/close')
  async close(@Param('id') id: string) {
    return this.liveChatService.close(id);
  }
}
