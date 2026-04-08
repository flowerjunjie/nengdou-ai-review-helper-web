import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClassesModule } from './modules/classes/classes.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { AiRulesModule } from './modules/ai-rules/ai-rules.module';
import { AiModelsModule } from './modules/ai-models/ai-models.module';
import { AiGradingModule } from './modules/ai-grading/ai-grading.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/lingxi_ai'),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'lingxi-ai-secret-key-2024',
      signOptions: { expiresIn: '15m' },
    }),
    AuthModule,
    UsersModule,
    ClassesModule,
    AssignmentsModule,
    SubmissionsModule,
    AiRulesModule,
    AiModelsModule,
    AiGradingModule,
    PermissionsModule,
    DashboardModule,
  ],
})
export class AppModule {}
