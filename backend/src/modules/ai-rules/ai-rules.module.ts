import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiRulesController } from './ai-rules.controller';
import { AiRulesService } from './ai-rules.service';
import { AiRule, AiRuleSchema } from '../../schemas/ai-rule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AiRule.name, schema: AiRuleSchema }]),
  ],
  controllers: [AiRulesController],
  providers: [AiRulesService],
  exports: [AiRulesService],
})
export class AiRulesModule {}
