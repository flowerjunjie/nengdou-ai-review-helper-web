import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole, UserRoleDocument } from '../../schemas/user-role.schema';
import { Role, RoleDocument } from '../../schemas/role.schema';
import { Menu, MenuDocument } from '../../schemas/menu.schema';

@Injectable()
export class UserRolesService {
  constructor(
    @InjectModel(UserRole.name) private userRoleModel: Model<UserRoleDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Menu.name) private menuModel: Model<MenuDocument>,
  ) {}

  async getUserRoles(userId: string) {
    const userRoles = await this.userRoleModel.find({ userId: new Types.ObjectId(userId) });
    const roleIds = userRoles.map(ur => ur.roleId);
    return this.roleModel.find({ _id: { $in: roleIds } });
  }

  async getUserPermissions(userId: string) {
    const roles = await this.getUserRoles(userId);
    const permissions = roles.flatMap(r => r.permissions || []);
    return [...new Set(permissions)];
  }

  async getUserMenus(userId: string) {
    const roles = await this.getUserRoles(userId);
    // Collect all menuIds from user's roles
    const menuIds = roles.flatMap(r => r.menuIds || []).filter(id => id);
    // Remove duplicates
    const uniqueMenuIds = [...new Set(menuIds.map(id => id.toString()))].map(id => new Types.ObjectId(id));
    const menus = await this.menuModel.find({ _id: { $in: uniqueMenuIds }, status: 'active' }).sort({ sort: 1 });

    // Build menu tree from flat list
    const menuMap = new Map<string, any>();
    const rootMenus: any[] = [];

    // First pass: create map of all menus
    menus.forEach(menu => {
      menuMap.set(menu._id.toString(), { ...menu.toObject(), children: [] });
    });

    // Second pass: build tree structure
    menus.forEach(menu => {
      const menuObj = menuMap.get(menu._id.toString());
      if (menu.parentId) {
        const parent = menuMap.get(menu.parentId.toString());
        if (parent) {
          parent.children.push(menuObj);
        } else {
          // Parent not found, treat as root
          rootMenus.push(menuObj);
        }
      } else {
        // No parent, it's a root menu
        rootMenus.push(menuObj);
      }
    });

    // Sort children by sort field
    const sortChildren = (menus: any[]) => {
      menus.sort((a, b) => (a.sort || 0) - (b.sort || 0));
      menus.forEach(m => sortChildren(m.children));
    };
    sortChildren(rootMenus);

    return rootMenus;
  }

  async getUserResources(userId: string) {
    const [roles, permissions, menus] = await Promise.all([
      this.getUserRoles(userId),
      this.getUserPermissions(userId),
      this.getUserMenus(userId),
    ]);
    return { roles, permissions, menus };
  }

  async assignRoles(userId: string, roleIds: string[]) {
    await this.userRoleModel.deleteMany({ userId: new Types.ObjectId(userId) });

    for (const roleId of roleIds) {
      await this.userRoleModel.create({
        userId: new Types.ObjectId(userId),
        roleId: new Types.ObjectId(roleId),
      });
    }

    return { message: '角色分配成功' };
  }
}
