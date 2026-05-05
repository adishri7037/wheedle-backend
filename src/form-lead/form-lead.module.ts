import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FormLeadController } from './form-lead.controller';
import { FormLeadService } from './form-lead.service';
import { FormLead, FormLeadSchema } from '../schemas/form-lead.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FormLead.name, schema: FormLeadSchema }]),
  ],
  controllers: [FormLeadController],
  providers: [FormLeadService]
})
export class FormLeadModule {}
