import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project } from '../schemas/project.schema';
import { User } from '../schemas/rbac/user.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async createProject(tenantId: string, payload: any): Promise<Project> {
    const project = new this.projectModel({
      tenantId: new Types.ObjectId(tenantId),
      ...payload,
      assignedClients: (payload.assignedClients || []).map((id: string) => new Types.ObjectId(id)),
      assignedTeamMembers: (payload.assignedTeamMembers || []).map((id: string) => new Types.ObjectId(id)),
    });
    
    const saved = await project.save();

    // Update assigned clients with this projectId
    if (saved.assignedClients.length > 0) {
      await this.userModel.updateMany(
        { _id: { $in: saved.assignedClients }, tenantId: new Types.ObjectId(tenantId) },
        { $set: { projectId: saved._id } }
      );
    }
    
    return saved;
  }

  async getProjects(tenantId: string): Promise<Project[]> {
    return this.projectModel
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .populate('assignedClients', 'name email')
      .populate('assignedTeamMembers', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getProjectById(tenantId: string, projectId: string): Promise<Project> {
    const project = await this.projectModel
      .findOne({ _id: new Types.ObjectId(projectId), tenantId: new Types.ObjectId(tenantId) })
      .populate('assignedClients', 'name email')
      .populate('assignedTeamMembers', 'name email')
      .exec();

    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async updateProject(tenantId: string, projectId: string, payload: any): Promise<Project> {
    const updateData = { ...payload };
    
    if (payload.assignedClients) {
      updateData.assignedClients = payload.assignedClients.map((id: string) => new Types.ObjectId(id));
    }
    if (payload.assignedTeamMembers) {
      updateData.assignedTeamMembers = payload.assignedTeamMembers.map((id: string) => new Types.ObjectId(id));
    }

    const project = await this.projectModel.findOneAndUpdate(
      { _id: new Types.ObjectId(projectId), tenantId: new Types.ObjectId(tenantId) },
      { $set: updateData },
      { new: true }
    );

    if (!project) throw new NotFoundException('Project not found');

    if (payload.assignedClients) {
      await this.userModel.updateMany(
        { _id: { $in: updateData.assignedClients }, tenantId: new Types.ObjectId(tenantId) },
        { $set: { projectId: project._id } }
      );
    }

    return project;
  }

  async archiveProject(tenantId: string, projectId: string): Promise<Project> {
    const project = await this.projectModel.findOneAndUpdate(
      { _id: new Types.ObjectId(projectId), tenantId: new Types.ObjectId(tenantId) },
      { $set: { status: 'Archived' } },
      { new: true }
    );
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
