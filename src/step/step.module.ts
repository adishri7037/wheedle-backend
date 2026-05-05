import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StepService } from './step.service';
import { StepController } from './step.controller';
import { Step, StepSchema } from '../schemas/step.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Step.name, schema: StepSchema }]),
  ],
  providers: [StepService],
  controllers: [StepController],
})
export class StepModule {}
