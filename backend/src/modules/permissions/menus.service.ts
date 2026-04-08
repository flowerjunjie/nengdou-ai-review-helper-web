import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Menu, MenuDocument } from '../../schemas/menu.schema';

@Injectable()
export class MenusService {
  constructor(
    @InjectModel(Menu.name) private menuModel: Model<MenuDocument>,
  ) {}

  async findAll() {
    return this.menuModel.find().sort({ sort: 1 });
  }

  async findById(id: string) {
    const menu = await this.menuModel.findById(id);
    if (!menu) throw new NotFoundException('菜单不存在');
    return menu;
  }

  async create(createDto: any) {
    return this.menuModel.create(createDto);
  }

  async update(id: string, updateDto: any) {
    return this.menuModel.findByIdAndUpdate(id, updateDto, { new: true });
  }

  async delete(id: string) {
    await this.menuModel.findByIdAndDelete(id);
    return { message: '删除成功' };
  }

  async getMenuTree() {
    const menus = await this.findAll();
    return this.buildTree(menus);
  }

  private buildTree(menus: MenuDocument[]) {
    const map = new Map();
    const roots: any[] = [];

    menus.forEach(menu => {
      map.set(menu._id.toString(), { ...menu.toObject(), children: [] });
    });

    menus.forEach(menu => {
      const node = map.get(menu._id.toString());
      if (menu.parentId) {
        const parent = map.get(menu.parentId.toString());
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}
