import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { Assignment, AssignmentSchema } from '../../schemas/assignment.schema';
import { Class, ClassSchema } from '../../schemas/class.schema';
import { ClassStudent, ClassStudentSchema } from '../../schemas/class-student.schema';
import { Submission, SubmissionSchema } from '../../schemas/submission.schema';
import { User, UserSchema } from '../../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assignment.name, schema: AssignmentSchema },
      { name: Class.name, schema: ClassSchema },
      { name: ClassStudent.name, schema: ClassStudentSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
