/** 根据后端返回的树形结构做遍历，删除children为[]的字段 */
/** 因为如果存在children字段，antd的table会认为该节点下还有children */
const deleteEmptyChildren = (list: defs.authorization.ResourceTreeObject[]) => {
  if (!list.length) return [];
  const res = list.map(item => {
    if (item.children!.length === 0) {
      delete item.children;
    } else {
      deleteEmptyChildren(item.children!);
    }
    return item;
  });
  return res;
};

export default deleteEmptyChildren;
