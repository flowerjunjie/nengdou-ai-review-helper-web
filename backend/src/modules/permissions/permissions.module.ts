import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { UserRolesController } from './user-roles.controller';
import { UserRolesService } from './user-roles.service';
import { Role, RoleSchema } from '../../schemas/role.schema';
import { Menu, MenuSchema } from '../../schemas/menu.schema';
import { UserRole, UserRoleSchema } from '../../schemas/user-role.schema';
import { User, UserSchema } from '../../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: Menu.name, schema: MenuSchema },
      { name: UserRole.name, schema: UserRoleSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RolesController, MenusController, UserRolesController],
  providers: [RolesService, MenusService, UserRolesService],
  exports: [RolesService, MenusService, UserRolesService],
})
export class PermissionsModule {}
