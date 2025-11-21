import { Link } from "@/models";
import { ILinks, ILinksCreationAttributes, ILinksUpdateAttributes } from "@/types";

export class LinkService {
  static async getAllLinks(): Promise<ILinks[]> {
    return await Link.findAll();
  }

  static async createLink(data: ILinksCreationAttributes): Promise<ILinks> {
    return await Link.create(data);
  }

  static async updateLink(id: number, data: ILinksUpdateAttributes): Promise<boolean> {
    await Link.update(data, { where: { id } });
    return true;
  }
}
