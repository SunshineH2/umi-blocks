import React, { useState, useEffect } from 'react';
import styles from './index.module.less';
import { Modal, Tag } from 'antd';
import SearchableTree from '../SearchableTree';
import { ItemInter } from '../../../../interfaces/common';
import { Card } from '@td-design/web';
import stores from '../../../../stores';
import { AuthorizationStore } from '../../../../interfaces/authorization.store';

interface SelectModalProps {
  onClose: () => void;
  visible: boolean;
}

const SelectModal: React.FC<SelectModalProps> = props => {
  const [currentCheckedKeys, setCurrentCheckedKeys] = useState<number[]>([]);
  const [currentCheckedItems, setCurrentCheckedItems] = useState<ItemInter[]>([]);
  const [members, setMembers] = useState<defs.authorization.PersonListDTO[]>([]);

  const authorizationStore = stores.useStore('authorizationStore') as AuthorizationStore;
  const { checkedKeys, checkedItems, setCheckedKeys, setCheckedItems } = authorizationStore;

  useEffect(() => {
    setCurrentCheckedKeys(checkedKeys);
    setCurrentCheckedItems(checkedItems);
  }, [checkedKeys, checkedItems]);

  /** 人员列表check事件 */
  const handleCheck = (checked: boolean, label: string, value: number) => {
    if (checked) {
      setCurrentCheckedKeys(currentCheckedKeys.concat([value]));
      setCurrentCheckedItems(currentCheckedItems.concat([{ label, value }]));
    } else {
      setCurrentCheckedKeys(currentCheckedKeys.filter(key => key !== value));
      setCurrentCheckedItems(currentCheckedItems.filter(item => item.value !== value));
    }
  };

  /** 全选 */
  const handleCheckAll = (checked: boolean) => {
    const itemList = members.map(item => ({ label: item.name!, value: item.userId! }));
    const keyList = members.map(item => item.userId!);

    if (checked) {
      setCurrentCheckedKeys([...new Set(currentCheckedKeys.concat(keyList))]);
      const obj = {};
      const items: ItemInter[] = [];
      const result = checkedItems.concat(itemList).reduce((item, next) => {
        obj[next.value] ? '' : (obj[next.value] = true && item.push(next));
        return item;
      }, items);
      setCurrentCheckedItems(result);
    } else {
      setCurrentCheckedKeys(currentCheckedKeys.filter(key => keyList.indexOf(key) < 0));
      setCurrentCheckedItems(currentCheckedItems.filter(item => keyList.indexOf(item.value) < 0));
    }
  };

  /** tag的删除事件 */
  const onDelete = (value: number) => {
    setCurrentCheckedKeys(currentCheckedKeys.filter(key => key !== value));
    setCurrentCheckedItems(currentCheckedItems.filter(item => item.value !== value));
  };

  /** 确定按钮点击事件 */
  const handleOk = () => {
    props.onClose();
    setCheckedKeys(currentCheckedKeys);
    setCheckedItems(currentCheckedItems);
  };

  return (
    <Modal
      title="选择人员"
      visible={props.visible}
      onOk={handleOk}
      onCancel={props.onClose}
      width={850}
    >
      <div className={styles.content}>
        <Card title="选择" className={styles.firstCard}>
          <SearchableTree
            checkedKeys={currentCheckedKeys}
            handleCheck={handleCheck}
            handleCheckAll={handleCheckAll}
            handleSelect={(members: defs.authorization.PersonListDTO[]) => setMembers(members)}
            members={members}
          />
        </Card>
        <Card title="已选" className={styles.secondCard}>
          {currentCheckedItems.map(tag => (
            <Tag
              closable
              onClose={() => onDelete(tag.value)}
              key={tag.value}
              style={{ marginBottom: '8px' }}
            >
              {tag.label}
            </Tag>
          ))}
        </Card>
      </div>
    </Modal>
  );
};
export default SelectModal;
