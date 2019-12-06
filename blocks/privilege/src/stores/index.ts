/*
 * @文件描述:
 * @公司: thundersdata
 * @作者: 陈杰
 * @Date: 2019-09-29 15:18:10
 * @LastEditors: 黄姗姗
 * @LastEditTime: 2019-12-05 19:52:15
 */
import IceStore from '@ice/store';
import authorizationStore from './authorization';

const iceStore = new IceStore();
const store = {
  authorizationStore,
};
Object.keys(store).forEach(key => {
  iceStore.registerStore(key, store[key]);
});

export default iceStore;
