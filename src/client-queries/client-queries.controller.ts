import { Controller, Get, Post, Put, Patch, Body, Param, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/rbac.decorator';
import { ClientQueriesService } from './client-queries.service';
import { ClientQueriesGateway } from './client-queries.gateway';

@Controller('client-queries')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ClientQueriesController {
  constructor(
    private clientQueriesService: ClientQueriesService,
    private clientQueriesGateway: ClientQueriesGateway
  ) {}

  @RequirePermission('client-queries', 'queries.create')
  @Post()
  async raiseQuery(@Req() req: any, @Body() body: any) {
    const tenantId = req.user?.tenantId;
    const clientId = req.user?.id;
    const projectId = req.user?.projectId;
    if (!tenantId || !clientId) {
      throw new BadRequestException('Invalid user context');
    }
    return this.clientQueriesService.raiseQuery(String(tenantId), String(clientId), projectId ? String(projectId) : undefined, body);
  }

  @RequirePermission('client-queries', 'queries.view')
  @Get()
  async getQueries(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('projectId') projectId?: string,
    @Query('search') search?: string
  ) {
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;
    const userId = req.user?.id;
    if (!tenantId || !role || !userId) {
      throw new BadRequestException('Invalid user context');
    }

    const effectiveProjectId = role === 'Client' ? req.user.projectId : projectId;

    return this.clientQueriesService.getQueries(String(tenantId), String(role), String(userId), effectiveProjectId, {
      status,
      priority,
      category,
      search,
    });
  }

  @RequirePermission('client-queries', 'queries.view')
  @Get(':id')
  async getQueryById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Invalid user context');
    }
    const query = await this.clientQueriesService.getQueryById(String(tenantId), id);

    // Hide internal notes from Client
    if (req.user?.role === 'Client') {
      const queryObj = query.toObject();
      delete queryObj.internalNotes;
      return queryObj;
    }
    return query;
  }

  @RequirePermission('client-queries', 'queries.view')
  @Get('task/:taskId')
  async getQueryByTaskId(@Req() req: any, @Param('taskId') taskId: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Invalid user context');
    }
    const query = await this.clientQueriesService.getQueryByTaskId(String(tenantId), taskId);

    // Hide internal notes from Client
    if (req.user?.role === 'Client') {
      const queryObj = query.toObject();
      delete queryObj.internalNotes;
      return queryObj;
    }
    return query;
  }

  @RequirePermission('client-queries', 'queries.assign')
  @Put(':id/assign')
  async assignQuery(@Req() req: any, @Param('id') id: string, @Body('assigneeId') assigneeId: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Invalid user context');
    }
    return this.clientQueriesService.assignQuery(String(tenantId), id, assigneeId);
  }

  @RequirePermission('client-queries', 'queries.update')
  @Patch(':id/status')
  async updateStatus(@Req() req: any, @Param('id') id: string, @Body('status') status: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Invalid user context');
    }
    return this.clientQueriesService.updateStatus(String(tenantId), id, status);
  }

  @RequirePermission('client-queries', 'queries.view')
  @Post(':id/messages')
  async addChatMessage(@Req() req: any, @Param('id') id: string, @Body() body: { text: string; mediaUrl?: string }) {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const userName = req.user?.name;
    
    if (!tenantId || !userId || !userName) {
      throw new BadRequestException('Invalid user context');
    }
    if (!body.text && !body.mediaUrl) {
      throw new BadRequestException('Message text or media is required');
    }
    
    try {
      await this.clientQueriesService.addChatMessage(
        String(tenantId),
        id,
        String(userId),
        String(userName),
        body.text || '',
        body.mediaUrl
      );
      const updatedQuery = await this.getQueryById(req, id);
      this.clientQueriesGateway.notifyQueryUpdate(id, updatedQuery);
      return updatedQuery;
    } catch (error: any) {
      console.error('Error in addChatMessage:', error);
      throw new BadRequestException(`Detailed Error: ${error.message} - ${error.stack}`);
    }
  }
}
