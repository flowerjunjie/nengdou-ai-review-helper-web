import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../../schemas/role.schema';
import { Menu, MenuDocument } from '../../schemas/menu.schema';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Menu.name) private menuModel: Model<MenuDocument>,
  ) {}

  async findAll(query: any) {
    const { page = 1, limit = 10, search, status } = query;
    const filter: any = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (status) filter.status = status;

    const total = await this.roleModel.countDocuments(filter);
    const items = await this.roleModel
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return { items, total, page, limit };
  }

  async findById(id: string) {
    const role = await this.roleModel.findById(id);
    if (!role) throw new NotFoundException('角色不存在');
    return role;
  }

  async findByIdWithMenus(id: string) {
    const role = await this.findById(id);
    const menus = await this.menuModel.find({ _id: { $in: role.permissions } });
    return { ...role.toObject(), menus };
  }

  async create(createDto: any) {
    return this.roleModel.create(createDto);
  }

  async update(id: string, updateDto: any) {
    return this.roleModel.findByIdAndUpdate(id, updateDto, { new: true });
  }

  async delete(id: string) {
    const role = await this.findById(id);
    if (role.isSystem) throw new Error('系统角色不能删除');
    await role.deleteOne();
    return { message: '删除成功' };
  }

  async assignMenus(roleId: string, menuIds: string[]) {
    await this.roleModel.findByIdAndUpdate(roleId, { menuIds });
    return { message: '菜单分配成功' };
  }
}
