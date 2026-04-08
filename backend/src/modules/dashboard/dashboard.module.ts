import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User, UserSchema } from '../../schemas/user.schema';
import { Class, ClassSchema } from '../../schemas/class.schema';
import { Assignment, AssignmentSchema } from '../../schemas/assignment.schema';
import { Submission, SubmissionSchema } from '../../schemas/submission.schema';
import { AiModel, AiModelSchema } from '../../schemas/ai-model.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Assignment.name, schema: AssignmentSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: AiModel.name, schema: AiModelSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
