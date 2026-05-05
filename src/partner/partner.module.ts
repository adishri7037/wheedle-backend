import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';
import { Partner, PartnerSchema } from '../schemas/partner.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Partner.name, schema: PartnerSchema }]),
  ],
  controllers: [PartnerController],
  providers: [PartnerService]
})
export class PartnerModule {}
