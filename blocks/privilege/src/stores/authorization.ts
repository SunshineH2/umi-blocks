/*
 * @文件描述: 权限管理store
 * @公司: thundersdata
 * @作者: 黄姗姗
 * @Date: 2019-12-04 16:20:00
 * @LastEditors: 黄姗姗
 * @LastEditTime: 2019-12-04 19:31:36
 */
import { AuthorizationStore } from '@/interfaces/authorization.store';

const authorizationStore: AuthorizationStore = {
  // 组织架构树
  orgList: [],

  // 选中的人的userId
  checkedKeys: [],

  // 选中的人
  checkedItems: [],

  setOrgList(orgList) {
    this.orgList = orgList;
  },

  setCheckedKeys(checkedKeys) {
    this.checkedKeys = checkedKeys;
  },

  setCheckedItems(checkedItems) {
    this.checkedItems = checkedItems;
  },
};

export default authorizationStore;
