import React, { useEffect, useState } from 'react';
import { Table } from '@td-design/web';
import { FormItemProps, FormValue } from '@td-design/web/lib/form-creator';
import { ActionButtonProps } from '@td-design/web/lib/action-buttons';
import { Button, Divider, Popconfirm, message } from 'antd';
import { PAGINATION_CONFIGS } from './constant';
import styles from './index.module.less';
import router from 'umi/router';
import { CustomWindow } from './interfaces/common';

const Authorization: React.FC = () => {
  const [roleListObj, setRoleList] = useState<
    defs.authorization.PagingEntity<defs.authorization.ResourceRole>
  >({
    pageSize: PAGINATION_CONFIGS.PAGE_SIZE,
    page: PAGINATION_CONFIGS.PAGE,
    list: [],
    total: PAGINATION_CONFIGS.TOTAL,
  });
  const [roleName, setRoleName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (page: number = PAGINATION_CONFIGS.PAGE, roleName?: string) => {
    try {
      setLoading(true);
      const result = await API.authorization.role.listPagination.fetch({
        clientKey: ((window as unknown) as CustomWindow).authConfig.client_id,
        page,
        pageSize: PAGINATION_CONFIGS.PAGE_SIZE,
        roleName,
      });
      setRoleList(result.data);
    } catch (error) {
      setRoleList(error.data);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  /** 查询 */
  const handleSubmit = (values: { [key: string]: FormValue }) => {
    const { roleName } = values;
    setRoleName('' + roleName);
    fetchData(PAGINATION_CONFIGS.PAGE, '' + roleName);
  };

  /** 重置 */
  const handleReset = () => {
    setRoleName('');
    fetchData();
  };

  /** 翻页 */
  const handlePaginationChange = (current: number) => {
    fetchData(current, roleName);
  };

  /** 查看 */
  const goDetail = (id: number) => {
    router.push(`/authorization/edit?id=${id}&detail=true`);
  };

  /** 编辑 */
  const goEdit = (id: number) => {
    router.push(`/authorization/edit?id=${id}`);
  };

  /** 删除 */
  const handleDelete = async (id: number) => {
    try {
      await API.authorization.role.resourceDelete.fetch({
        clientKey: ((window as unknown) as CustomWindow).authConfig.client_id,
        id,
      });
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error(error.message);
    }
  };

  const formItems: FormItemProps[] = [
    {
      formLabel: '角色名称：',
      name: 'roleName',
      type: 'input',
      columns: 1,
    },
  ];

  const actions: ActionButtonProps[] = [
    {
      text: '新增角色',
      onClick: () => router.push('/authorization/edit'),
      type: 'primary',
    },
  ];

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'role',
    },
    {
      title: '角色描述',
      dataIndex: 'comment',
      render: (value: string) => {
        return value || '-';
      },
    },
    {
      title: '操作',
      render: (record: defs.authorization.ResourceRole) => (
        <span>
          <Button className={styles.button} type="link" onClick={() => goDetail(record.id!)}>
            查看
          </Button>
          <Divider type="vertical"></Divider>
          <Button className={styles.button} type="link" onClick={() => goEdit(record.id!)}>
            编辑
          </Button>
          <Divider type="vertical"></Divider>
          <Popconfirm
            title="确定删除么？"
            onConfirm={() => handleDelete(record.id!)}
            okText="删除"
            okType="danger"
            cancelText="取消"
          >
            <Button className={styles.button} type="link">
              删除
            </Button>
          </Popconfirm>
        </span>
      ),
    },
  ];

  return (
    <Table
      header=""
      formItems={formItems}
      onSubmit={handleSubmit}
      onReset={handleReset}
      actions={actions}
      showTip={false}
      columns={columns}
      pagination={{
        total: roleListObj.total,
        current: roleListObj.page,
        onChange: handlePaginationChange,
        pageSize: PAGINATION_CONFIGS.PAGE_SIZE,
        showQuickJumper: true,
      }}
      dataSource={roleListObj.list}
      rowKey="id"
      loading={loading}
    />
  );
};

export default Authorization;
