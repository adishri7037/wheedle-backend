import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact } from '../schemas/contact.schema';

@Injectable()
export class ContactService {
  constructor(@InjectModel(Contact.name) private contactModel: Model<Contact>) {}

  async create(data: any) {
    const newContact = new this.contactModel(data);
    return newContact.save();
  }

  async findAll() {
    return this.contactModel.find().exec();
  }
}
