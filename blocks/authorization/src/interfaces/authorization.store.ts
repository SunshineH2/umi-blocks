import { ItemInter } from './common';

/*
 * @文件描述: 权限管理
 * @公司: thundersdata
 * @作者: 黄姗姗
 * @Date: 2019-12-04 16:20:58
 * @LastEditors: 黄姗姗
 * @LastEditTime: 2019-12-04 19:30:59
 */
export interface AuthorizationStore {
  orgList: defs.authorization.OrgTreeDTO[];
  checkedKeys: number[];
  checkedItems: ItemInter[];

  setOrgList: (orgList: defs.authorization.OrgTreeDTO[]) => void;
  setCheckedKeys: (checkedKeys: number[]) => void;
  setCheckedItems: (checkedItems: ItemInter[]) => void;
}
