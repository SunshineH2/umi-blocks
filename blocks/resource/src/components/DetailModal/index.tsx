import React from 'react';
import { Modal } from 'antd';
import styles from './index.module.less';
import { TYPE_LIST } from '../../constant';

interface DetailModalProps {
  visible: boolean;
  onClose: () => void;
  detail: defs.authorization.ResourceDetails;
}

const DetailModal = (props: DetailModalProps) => {
  const { visible, onClose, detail } = props;

  let typeName = '';
  const matchTypeObj = TYPE_LIST.find(row => row.value === detail.type);
  if (matchTypeObj) {
    typeName = matchTypeObj.title;
  }

  return (
    <Modal visible={visible} footer={null} onCancel={onClose} centered title="资源详情" width={600}>
      <div className={styles.detailModal}>
        <div className={styles.row}>
          <div className={styles.item}>
            <span className={styles.label}>资源标识:</span>
            <span className={styles.value}>{detail.resourceKey || '-'}</span>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>资源顺位:</span>
            <span className={styles.value}>{detail.orderValue || '-'}</span>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.item}>
            <span className={styles.label}>资源URL:</span>
            <span className={styles.value}>{detail.apiUrl || '-'}</span>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.item}>
            <span className={styles.label}>资源类型:</span>
            <span className={styles.value}>{typeName}</span>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>资源码:</span>
            <span className={styles.value}>{detail.permissionCode || '-'}</span>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.item}>
            <span className={styles.label}>拓展字段:</span>
            <span className={styles.value}>{detail.resourceBusinessValue || '-'}</span>
          </div>
          <div className={styles.item}>
            <span className={styles.label}>资源描述:</span>
            <span className={styles.value}>{detail.description || '-'}</span>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.item}>
            <span className={styles.label}>父级菜单:</span>
            <span className={styles.value}>{detail.parentName || '-'}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DetailModal;
