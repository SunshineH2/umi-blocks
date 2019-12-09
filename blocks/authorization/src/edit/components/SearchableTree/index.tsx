import React, { useState } from 'react';
import { Input, Tree, Checkbox } from 'antd';
import { difference } from 'lodash';
import styles from './index.module.less';
import { AntTreeNode, AntTreeNodeSelectedEvent } from 'antd/lib/tree';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import stores from '../../../stores';
import { AuthorizationStore } from '../../../interfaces/authorization.store';

const { TreeNode } = Tree;
const { Search } = Input;

interface SearchableTreeProps {
  members: defs.authorization.PersonListDTO[];
  checkedKeys: number[];
  handleSelect: (personListDTOList: defs.authorization.PersonListDTO[]) => void;
  handleCheck: (checked: boolean, name: string, value: number) => void;
  handleCheckAll: (checked: boolean) => void;
}

const SearchableTree: React.FC<SearchableTreeProps> = props => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);

  const authorizationStore = stores.useStore('authorizationStore') as AuthorizationStore;
  const { orgList } = authorizationStore;

  const handleExpand = (expandedKeys: string[]) => {
    setExpandedKeys([...new Set(expandedKeys)]);
    setAutoExpandParent(false);
  };

  /** 搜索框change事件 */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { value } = e.target;
    value = value.trim();
    if (!value) {
      setExpandedKeys([]);
      return;
    }
    const matchedKeys: string[] = [];
    const loop = (data: defs.authorization.OrgTreeDTO[]) =>
      data.forEach(item => {
        if (item.orgName!.indexOf(value) > -1) {
          matchedKeys.push(item.id + '');
        }
        if (item.children && item.children.length) {
          loop(item.children);
        }
      });
    loop(orgList);
    setExpandedKeys([...matchedKeys]);
    setAutoExpandParent(true);
  };

  /** 渲染组织结构 */
  const getTreeNode = (data: defs.authorization.OrgTreeDTO[] = []) => {
    return data.map(item => {
      const { orgName, id, ...restValues } = item;
      return (
        <TreeNode key={id + ''} title={orgName} {...restValues}>
          {item.children && item.children.length && getTreeNode(item.children)}
        </TreeNode>
      );
    });
  };

  /** 点击树节点后将该节点下的person传到父组件中 */
  const onSelect = (_: string[], e: AntTreeNodeSelectedEvent) => {
    const { personListDTOList } = e.node.props;
    if (e.selected) {
      props.handleSelect(personListDTOList);
    } else {
      props.handleSelect([]);
    }
  };

  /** 勾选人员列表 */
  const onCheck = (e: CheckboxChangeEvent) => {
    const { checked, name, value } = e.target;
    props.handleCheck(checked, name!, value);
  };

  /** 全选 */
  const onCheckAll = (e: CheckboxChangeEvent) => {
    props.handleCheckAll(e.target.checked);
  };

  const filterTreeNode = (node: AntTreeNode) => {
    return expandedKeys && expandedKeys.indexOf(node.props.eventKey!) > -1;
  };

  return (
    <>
      <div className={styles.searchInput}>
        <Search placeholder="请输入部门" style={{ width: '100%' }} onChange={handleChange} />
      </div>
      <div className={styles.searchContent}>
        <div className={styles.searchTree}>
          <div className={styles.searchPersonTitle}>机构组织架构</div>
          <Tree
            onSelect={onSelect}
            autoExpandParent={autoExpandParent}
            onExpand={handleExpand}
            expandedKeys={expandedKeys}
            filterTreeNode={filterTreeNode}
          >
            {getTreeNode(orgList)}
          </Tree>
        </div>
        <div className={styles.searchPersonList}>
          <div className={styles.searchPersonTitle}>人员列表</div>

          <div className={styles.searchPersonCheckWrap}>
            <Checkbox
              checked={
                difference(props.members.map(item => item.userId), props.checkedKeys).length ===
                  0 && props.members.length > 0
              }
              onChange={onCheckAll}
            >
              全选
            </Checkbox>
          </div>
          {props.members.length > 0 &&
            props.members.map(member => (
              <div key={member.id} className={styles.searchPersonCheckWrap}>
                <Checkbox
                  checked={props.checkedKeys.includes(member.userId!)}
                  onChange={onCheck}
                  value={member.userId}
                  name={member.name}
                >
                  {member.name}
                </Checkbox>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default SearchableTree;
