import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { AiGradingController } from './ai-grading.controller';
import { AiGradingService } from './ai-grading.service';
import { AiModelsModule } from '../ai-models/ai-models.module';
import { SubmissionsModule } from '../submissions/submissions.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { AiModel, AiModelSchema } from '../../schemas/ai-model.schema';
import { Submission, SubmissionSchema } from '../../schemas/submission.schema';
import { Assignment, AssignmentSchema } from '../../schemas/assignment.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: AiModel.name, schema: AiModelSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Assignment.name, schema: AssignmentSchema },
    ]),
    AiModelsModule,
    SubmissionsModule,
    AssignmentsModule,
  ],
  controllers: [AiGradingController],
  providers: [AiGradingService],
})
export class AiGradingModule {}
