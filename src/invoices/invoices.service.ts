import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice } from '../schemas/invoice.schema';

@Injectable()
export class InvoicesService {
  constructor(@InjectModel(Invoice.name) private invoiceModel: Model<Invoice>) {}

  async create(createDto: any): Promise<Invoice> {
    const created = new this.invoiceModel(createDto);
    return created.save();
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceModel.find().sort({ createdAt: -1 }).exec();
  }

  async remove(id: string): Promise<any> {
    return this.invoiceModel.findByIdAndDelete(id).exec();
  }

  async update(id: string, updateDto: any): Promise<Invoice | null> {
    return this.invoiceModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  }
}
