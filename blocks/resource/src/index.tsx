import React, { useState, useEffect, useCallback } from 'react';
import styles from './index.module.less';
import { Table } from '@td-design/web';
import { FormItemProps, FormValue } from '@td-design/web/lib/form-creator';
import { Popconfirm, message, Divider, Button } from 'antd';
import router from 'umi/router';
import { PAGINATION_CONFIGS, TYPE_LIST } from './constant';
import deleteEmptyChildren from './utils/deleteEmptyChildren';
import DetailModal from './components/DetailModal';
import { CustomWindow } from './interfaces/common';

const formItems: FormItemProps[] = [
  { name: 'resourceKey', formLabel: '资源标识', type: 'input', columns: 1 },
  {
    name: 'type',
    formLabel: '资源类型',
    type: 'select',
    dataSource: TYPE_LIST,
    columns: 1,
  },
];
interface Params {
  resourceKey?: string;
  type?: number;
}

const defaultDetail = {
  clientKey: '',
  resourceKey: '',
  orderValue: undefined,
  apiUrl: '',
  type: undefined,
  permissionCode: '',
  resourceBusinessValue: '',
  description: '',
  parentName: '',
  parentId: undefined,
};

function List() {
  const [visible, setVisible] = useState<boolean>(false);
  const [detail, setDetail] = useState<defs.authorization.ResourceDetails>(defaultDetail);
  const [list, setList] = useState<
    defs.authorization.ResourceTreeObject[] | defs.authorization.ResourceObject[]
  >([]);

  const [params, setParams] = useState<Params>({});
  const [withParams, setWithParams] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // 获取带分页的平行结构的资源列表
  const fetchList = async (
    page: number = PAGINATION_CONFIGS.PAGE,
    searchParams: Params = params,
  ) => {
    try {
      setLoading(true);
      const { resourceKey, type } = searchParams;
      const response = await API.authorization.resource.listPagination.fetch({
        resourceKey,
        type,
        page,
        clientKey: ((window as unknown) as CustomWindow).authConfig.client_id,
        pageSize: PAGINATION_CONFIGS.PAGE_SIZE,
      });
      setList(response.data.list);
      setPagination({
        total: response.data.total,
        current: response.data.page,
        onChange: handlePaginationChange,
        pageSize: PAGINATION_CONFIGS.PAGE_SIZE,
        showQuickJumper: true,
      });
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取不带分页的树形结构的资源列表
  const fetchTreeList = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.authorization.resource.listTree.fetch({
        clientKey: ((window as unknown) as CustomWindow).authConfig.client_id,
      });
      setList(deleteEmptyChildren(response.data));
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreeList();
  }, [fetchTreeList]);

  const handlePaginationChange = (current: number) => {
    fetchList(current);
  };

  const [pagination, setPagination] = useState({
    total: PAGINATION_CONFIGS.TOTAL,
    current: PAGINATION_CONFIGS.PAGE,
    onChange: handlePaginationChange,
    pageSize: PAGINATION_CONFIGS.PAGE_SIZE,
    showQuickJumper: true,
  });

  const fetchDetail = async (id: number) => {
    try {
      setVisible(true);
      const response = await API.authorization.resource.detail.fetch({ id });
      setDetail(response.data);
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleSubmit = (values: { [key: string]: FormValue }) => {
    const { resourceKey, type } = values;
    const params = {
      resourceKey: resourceKey ? `${resourceKey}` : '',
      type: type !== undefined ? Number(type) : undefined,
    };
    setParams(params);
    setWithParams(true);
    fetchList(PAGINATION_CONFIGS.PAGE, params);
  };

  const deleteResource = async (id: number) => {
    try {
      await API.authorization.resource.deleteResource.fetch({
        clientKey: ((window as unknown) as CustomWindow).authConfig.client_id,
        id: id + '',
      });
      message.success('删除成功!');
      if (!withParams) {
        fetchTreeList();
      } else {
        fetchList();
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  const onReset = () => {
    setParams({});
    setWithParams(false);
    fetchTreeList();
  };

  const columns = [
    {
      title: '资源URL',
      dataIndex: 'apiUrl',
    },
    {
      title: '资源标识',
      dataIndex: 'resourceKey',
    },
    {
      title: '资源描述',
      dataIndex: 'description',
      render: (value: string) => value || '-',
    },
    {
      title: '操作',
      render: (
        record: defs.authorization.ResourceObject | defs.authorization.ResourceTreeObject,
      ) => (
        <div>
          <Button type="link" onClick={() => fetchDetail(record.id!)} style={{ padding: '0' }}>
            查看
          </Button>
          <Divider type="vertical" />
          <Button
            type="link"
            style={{ padding: '0' }}
            onClick={() => router.push({ pathname: `/resource/edit`, query: { id: record.id } })}
          >
            编辑
          </Button>
          <Divider type="vertical" />
          <Popconfirm
            title="确定删除么？"
            onConfirm={() => deleteResource(record.id!)}
            okText="删除"
            okType="danger"
            cancelText="取消"
          >
            <Button type="link" style={{ padding: '0' }}>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Table
        header=""
        showTip={false}
        formItems={formItems}
        onSubmit={handleSubmit}
        onReset={onReset}
        pagination={withParams ? pagination : false}
        columns={columns}
        dataSource={list}
        rowKey="id"
        loading={loading}
        actions={[
          {
            text: '新增资源',
            onClick: () => router.push({ pathname: '/resource/edit' }),
            type: 'primary',
          },
        ]}
      />
      {visible && (
        <DetailModal visible={visible} onClose={() => setVisible(false)} detail={detail} />
      )}
    </div>
  );
}
export default List;
