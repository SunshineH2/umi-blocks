import React, { useState, useEffect, useCallback } from 'react';
import { Container } from '@td-design/web';
import { Form, Row, Col, Input, Button, Table, Checkbox, message, Modal } from 'antd';
import { PageBasicPropsModel, ItemInter, CustomWindow } from '../../interfaces/common';
import { FormComponentProps } from 'antd/lib/form';
import { array } from '@td-design/utils';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import styles from './index.module.less';
import router from 'umi/router';
import deleteEmptyChildren from '../../utils/deleteEmptyChildren';
import SelectModal from './components/SelectModal';
import stores from '../../stores';
import { AuthorizationStore } from '../../interfaces/authorization.store';

const FormItem = Form.Item;
const { TextArea } = Input;

const formLayout = {
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 12,
  },
};

const textAreaLayout = {
  labelCol: {
    span: 3,
  },
  wrapperCol: {
    span: 18,
  },
};

interface ResourceInter {
  id: number;
  checked: boolean;
}

interface EditProps extends PageBasicPropsModel, FormComponentProps {}

const Edit: React.FC<EditProps> = props => {
  const { getFieldDecorator, setFieldsValue } = props.form;

  const authorizationStore = stores.useStore('authorizationStore') as AuthorizationStore;
  const {
    setOrgList,
    checkedKeys,
    checkedItems,
    setCheckedKeys,
    setCheckedItems,
  } = authorizationStore;

  const [roleId, setRoleId] = useState<number>(0); // 角色id
  const [isDetailPage, setIsDetailPage] = useState<boolean>(false); // 是否为详情页面
  const [list, setList] = useState<defs.authorization.ResourceTreeObject[]>([]); // 树形结构数据
  const [resources, setResources] = useState<ResourceInter[]>([]); // 传给后端的资源ids
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]); // 左侧表格中的选中行的key
  const [visible, setVisible] = useState<boolean>(false); // 选择负责人弹窗的显示
  const [loading, setLoading] = useState<boolean>(false);

  const loopList = (data: defs.authorization.OrgTreeDTO[]) => {
    const arr: ItemInter[] = [];
    const loop = (data: defs.authorization.OrgTreeDTO[]) => {
      data.map(item => {
        if (item.personListDTOList && item.personListDTOList.length) {
          item.personListDTOList.map(person => {
            arr.push({ label: person.name!, value: person.userId! });
          });
        }
        if (item.children && item.children.length) {
          loop(item.children);
        }
      });
    };
    loop(data);
    return arr;
  };

  /** 找到parentId对应的id */
  const getParentIds = useCallback(
    (parentId: number, data: defs.authorization.ResourceTreeObject[]) => {
      const parentIds: number[] = [];
      const findParentId = (data: defs.authorization.ResourceTreeObject[], parentId: number) => {
        if (parentId) {
          const res = data.find(item => item.id === parentId)!.parentId!;
          parentIds.push(res);
          findParentId(data, res);
        }
      };
      findParentId(array.deepFlatten(data), parentId);
      return parentIds.slice(0, -1);
    },
    [],
  );

  /** 根据详情回显已经选中的user */
  const setCheckedUsers = useCallback(
    (userIdList: number[] = [], currentOrgList: defs.authorization.OrgTreeDTO[] = []) => {
      const list = loopList(currentOrgList);
      const checkedItems: ItemInter[] = [];
      list.forEach(item => {
        if (userIdList.indexOf(item.value) !== -1) {
          checkedItems.push(item);
        }
      });
      setCheckedKeys(userIdList);
      setCheckedItems(checkedItems);
    },
    [setCheckedItems, setCheckedKeys],
  );

  /** 编辑状态下获取角色详情 */
  const fetchInitValue = useCallback(
    async (
      roleId: number,
      resList: ResourceInter[],
      currentList: defs.authorization.ResourceTreeObject[],
      currentOrgList: defs.authorization.OrgTreeDTO[],
    ) => {
      try {
        const response = await API.authorization.role.resourceRoleDetailUser.fetch({
          clientKey: ((window as unknown) as CustomWindow).authConfig.client_id,
          roleId,
        });
        const { role, comment, resourceVOList, userIdList } = response.data;
        // 回显表单数据
        setFieldsValue({
          role,
          comment,
          userIds: userIdList,
        });
        // 回显负责人
        setCheckedUsers(userIdList, currentOrgList);
        // 回显选中的权限
        const ids = resourceVOList!.map(item => item.id);
        const currentResources = resList.map(resource =>
          ids.indexOf(resource.id) > -1 ? { id: resource.id, checked: true } : resource,
        );
        setResources(currentResources);
        const parentIds: number[] = [];
        // 找到选中的权限id的所有父节点
        resourceVOList!.map(item => {
          parentIds.push(...getParentIds(item.parentId!, currentList), item.parentId!);
        });
        const selectedIds: number[] = [];
        [...new Set(parentIds)].map(parentId => {
          // 该id下的所有功能权限id列表
          const allPrivilegeIds = getChildren(currentList, parentId)
            .map(item => item.privilegeList!.map(i => i.id))
            .flat();
          // 和currentResources做匹配，
          const allChecked = currentResources
            .filter(item => allPrivilegeIds.indexOf(item.id) > -1)
            .every(i => i.checked);
          if (allChecked) {
            selectedIds.push(parentId);
          }
        });
        setSelectedRowKeys(selectedIds);
      } catch (error) {
        message.error(error.message);
      }
    },
    [getParentIds, setCheckedUsers, setFieldsValue],
  );

  /** 获取后端数据并进行处理 */
  const fetchData = useCallback(
    async (currentOrgList: defs.authorization.OrgTreeDTO[]) => {
      try {
        setLoading(true);
        const response = await API.authorization.resource.listTree.fetch({
          clientKey: ((window as unknown) as CustomWindow).authConfig.client_id,
        });
        const currentList = deleteEmptyChildren(response.data);
        setList(currentList);
        // 把树形结构打平，并把每个功能权限的checkbox设为false
        const ids = array
          .deepFlatten(currentList)
          .map(item => item.privilegeList!.map(privilege => privilege.id));
        const res = ids.flat().map(id => ({
          id: id!,
          checked: false,
        }));
        setResources(res);
        const { id } = props.location.query;
        if (id) {
          fetchInitValue(+id, res, currentList, currentOrgList);
        }
      } catch (error) {
        message.error(error.message);
        setList(error.data || []);
      } finally {
        setLoading(false);
      }
    },
    [fetchInitValue, props.location.query],
  );

  useEffect(() => {
    (async function fetchOrgList() {
      try {
        // 获取组织架构树（用于选择负责人弹窗）
        const result = await API.authorization.data.getMockData.fetch();
        setOrgList(result.data);
        // 获取权限列表
        fetchData(result.data);
        const { id, detail } = props.location.query;
        if (id) {
          setRoleId(+id);
        }
        if (detail === 'true') {
          setIsDetailPage(true);
        }
      } catch (error) {
        message.error(error.message);
      }
    })();
  }, [setOrgList, fetchData, props.location.query]);

  /** 提交 */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    props.form.validateFields(async (err, values) => {
      if (!err) {
        const { role, comment } = values;
        const resourceIds = resources.filter(resource => resource.checked).map(item => item.id);
        const params: defs.authorization.RoleDTO = {
          clientKey: ((window as unknown) as CustomWindow).authConfig.client_id,
          role,
          comment,
          resourceIds,
          userIds: checkedKeys,
        };
        if (roleId) {
          params.id = roleId;
        }
        try {
          await API.authorization.role.resourceSaveAddUser.fetch(params);
          message.success('保存成功！');
          router.push('/authorization');
        } catch (error) {
          message.error(error.message);
        }
      }
    });
  };

  /** 取消 */
  const handleCancel = () => {
    router.goBack();
  };

  /** 全选 */
  const allSelected = () => {
    const currentList = array.deepFlatten(list).map(item => item.id!);
    setSelectedRowKeys(currentList);
    const currentResources = resources.map(item => ({
      id: item.id,
      checked: true,
    }));
    setResources(currentResources);
  };

  /** 清空 */
  const clearSelected = () => {
    setSelectedRowKeys([]);
    const currentResources = resources.map(item => ({
      id: item.id,
      checked: false,
    }));
    setResources(currentResources);
  };

  /** 删除 */
  const handleDelete = () => {
    Modal.confirm({
      title: '确定删除吗？',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await API.authorization.role.resourceDelete.fetch({
            clientKey: ((window as unknown) as CustomWindow).authConfig.client_id,
            id: roleId,
          });
          message.success('删除成功');
          router.push('/authorization');
        } catch (error) {
          message.error(error.message);
        }
      },
    });
  };

  const handleCheckboxChange = (
    e: CheckboxChangeEvent,
    privilegeId: number,
    record: defs.authorization.ResourceTreeObject,
  ) => {
    const { checked } = e.target;
    const res = resources.map(resource =>
      resource.id === privilegeId ? { id: privilegeId, checked } : resource,
    );
    setResources(res);

    if (record.children) {
      // 当前以及children下的所有功能权限id
      const allPrivilegeIds = array
        .deepFlatten([record])
        .map(item => item.privilegeList!.map(priviledge => priviledge.id!))
        .flat();
      judgeCurrentRecordIsAllChecked(allPrivilegeIds, privilegeId, checked, record);
    } else {
      // 当前record中的功能权限id
      const allPrivilegeIds = record.privilegeList!.map(i => i.id!);
      judgeCurrentRecordIsAllChecked(allPrivilegeIds, privilegeId, checked, record);
    }
  };

  /** 判断当前record下的privilege是否全被选中 */
  const judgeCurrentRecordIsAllChecked = (
    allPrivilegeIds: number[],
    privilegeId: number,
    checked: boolean,
    record: defs.authorization.ResourceTreeObject,
  ) => {
    // 筛选出resources中当前行的privilegeList
    const currentIds = resources.filter(resource => allPrivilegeIds.some(id => resource.id === id));
    // 用当前id的checkbox去替换resources中的checkbox，并判断是否全被选中
    const bool = currentIds
      .map(item => (item.id === privilegeId ? { id: privilegeId, checked } : item))
      .every(item => item.checked);
    if (bool) {
      setSelectedRowKeys([
        ...selectedRowKeys,
        record.id!,
        ...getParentAllChecked(privilegeId, checked, record.parentId!),
      ]);
    } else {
      const parentIds = getParentIds(record.parentId!, list);
      const res = selectedRowKeys.filter(
        item => [record.id, record.parentId, ...parentIds].indexOf(item) < 0,
      );
      setSelectedRowKeys(res);
    }
  };

  /** 判断当前id的parent的privilege是否全被选中，返回功能权限已被选中的parentId */
  const getParentAllChecked = (privilegeId: number, checked: boolean, parentId: number) => {
    // 首先找到parentIds
    const parentIds = getParentIds(parentId, list).concat([parentId]);
    // 筛选出parentIds数组里面每个id所对应的privilegeList都已经选中的parentId
    const parentLists = array.deepFlatten(list).filter(item => parentIds.indexOf(item.id!) > -1);
    const checkedParentIds: number[] = [];
    parentLists.map(item => {
      // 当前id的功能权限id
      const privilegeIds = item.privilegeList!.map(item => item.id);
      // 当前id的children的功能权限id
      const flattenChildrenList = getChildren(list, item.id!)
        .map(i => i.privilegeList!.map(privilege => privilege.id))
        .flat();
      // 获取当前id以及children的resourceObj的数组
      const matchResourceIds = resources.filter(resource =>
        [...flattenChildrenList, ...privilegeIds].some(id => resource.id === id),
      );
      const isAllChecked = matchResourceIds
        .map(item => (item.id === privilegeId ? { id: privilegeId, checked } : item))
        .every(item => item.checked);
      if (isAllChecked) {
        checkedParentIds.push(item.id!);
      }
    });
    return checkedParentIds;
  };

  /** 根据id找到对应的list以及children并把数据打平 */
  const getChildren = (data: defs.authorization.ResourceTreeObject[], id: number) => {
    const resList: defs.authorization.ResourceTreeObject[] = [];
    const findChildren = (data: defs.authorization.ResourceTreeObject[], id: number) => {
      data.map(obj => {
        if (obj.id === id) {
          resList.push(obj);
        } else {
          obj.children && findChildren(obj.children, id);
        }
      });
    };
    findChildren(data, id);
    return array.deepFlatten(resList);
  };

  const columns = [
    {
      title: '模块',
      dataIndex: 'description',
      width: '30%',
    },
    {
      title: '功能权限',
      width: '70%',
      render: (record: defs.authorization.ResourceTreeObject) => {
        return record.privilegeList && record.privilegeList.length ? (
          <>
            {record.privilegeList.map(item => {
              const res = resources.find(resource => resource.id === item.id);
              const checked = res ? res.checked : false;
              return (
                <Checkbox
                  checked={checked}
                  key={item.id}
                  onChange={e => handleCheckboxChange(e, item.id!, record)}
                >
                  {item.description}
                </Checkbox>
              );
            })}
          </>
        ) : (
          <span>-</span>
        );
      },
    },
  ];

  const rowSelection = {
    // 选中项的key数组
    selectedRowKeys,

    onSelect: (record: defs.authorization.ResourceTreeObject, selected: boolean) => {
      // 包含当前行以及当前行下的children的数据
      const flattenRows = array.deepFlatten([record]);
      const flattenKeys = flattenRows.map(item => item.id!);
      const flattenResources = flattenRows
        .map(item => item.privilegeList!.map(privilege => privilege.id))
        .flat();
      // 当前行的parent的数据
      const parentIds = getParentIds(record.id!, list);

      // 选择/取消某行后控制功能权限为选中/不选中
      const res = resources
        .filter(resource => flattenResources.every(id => id !== resource.id))
        .concat(flattenResources.map(id => ({ id: id!, checked: selected })));
      setResources(res);

      // 控制当前行的children的key被选中/取消
      if (selected) {
        // 判断每一个parentId下的数据所对应的children的id
        const resKeys: number[] = [];
        parentIds.map(parentId => {
          // id下的childrenid
          const childrenIds = getChildren(list, parentId).map(item => item.id);
          // 把childrenId与list做匹配
          const childrenList = array
            .deepFlatten(list)
            .filter(item => childrenIds.indexOf(item.id) > -1);
          // 获取到除当前id及children的privilegeIds
          const privilegeIds = childrenList
            .map(item => item.privilegeList!.map(i => i.id))
            .flat()
            .filter(item => flattenResources.indexOf(item) < 0);
          // 判断是否已经选中
          const allChecked = resources
            .filter(resource => privilegeIds.indexOf(resource.id) > -1)
            .every(item => item.checked);
          if (allChecked) {
            resKeys.push(parentId);
          }
        });
        setSelectedRowKeys([...selectedRowKeys, ...flattenKeys, ...resKeys]);
      } else {
        const res = selectedRowKeys.filter(
          item => [...flattenKeys, ...parentIds].indexOf(item) < 0,
        );
        setSelectedRowKeys(res);
      }
    },

    onSelectAll: (selected: boolean, selectedRows: defs.authorization.ResourceTreeObject[]) => {
      // 控制selectedRowKeys
      if (selected) {
        const selectedRowKeys = selectedRows.map(item => item.id!);
        setSelectedRowKeys(selectedRowKeys);
      } else {
        setSelectedRowKeys([]);
      }

      // 控制功能权限全部选中/取消
      const ids = array
        .deepFlatten(list)
        .map(item => item.privilegeList!.map(privilege => privilege.id));
      const res = ids.flat().map(id => ({
        id: id!,
        checked: selected,
      }));
      setResources(res);
    },
  };

  const renderHeader = () => {
    let header = '新增角色';
    if (roleId) {
      header = '编辑角色';
    }
    if (roleId && isDetailPage) {
      header = '角色详情';
    }
    return header;
  };

  return (
    <Container header={renderHeader()} style={{ fontSize: '16px' }}>
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col span={12}>
            <FormItem label="角色名称：" {...formLayout}>
              {getFieldDecorator('role', {
                rules: [
                  {
                    required: true,
                    message: '请输入角色名称',
                  },
                ],
              })(<Input placeholder="角色名称不能重复" />)}
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem label="负责人：" {...formLayout}>
              {getFieldDecorator('userIds')(
                <div className={styles.personWrap}>
                  <Button
                    onClick={() => setVisible(!visible)}
                    type="primary"
                    style={{ margin: '0 5px 5px 0' }}
                  >
                    请选择
                  </Button>
                  {checkedItems.map(item => (
                    <span key={item.value} className={styles.person}>
                      {item.label}
                    </span>
                  ))}
                </div>,
              )}
            </FormItem>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <FormItem label="角色描述：" {...textAreaLayout}>
              {getFieldDecorator('comment')(
                <TextArea placeholder="请输入角色描述" autoSize={{ minRows: 2 }} />,
              )}
            </FormItem>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <FormItem label="用户权限列表：" {...formLayout}>
              {getFieldDecorator('buttons')(
                <>
                  <Button type="default" onClick={allSelected} style={{ marginRight: '15px' }}>
                    全选
                  </Button>
                  <Button type="default" onClick={clearSelected}>
                    清空
                  </Button>
                </>,
              )}
            </FormItem>
          </Col>
        </Row>
        <Row>
          <Col span={3}></Col>
          <Col span={18}>
            <Table
              rowKey="id"
              columns={columns}
              rowSelection={rowSelection}
              dataSource={list}
              bordered
              pagination={false}
              loading={loading}
            />
          </Col>
        </Row>
        <div className={styles.buttonsWrap}>
          <Button className={styles.button} onClick={handleCancel}>
            返回
          </Button>
          {!isDetailPage && (
            <>
              {!!roleId && (
                <Button className={styles.button} type="danger" onClick={handleDelete}>
                  删除
                </Button>
              )}
              <Button className={styles.button} htmlType="submit" type="primary">
                {roleId ? '保存' : '新增'}
              </Button>
            </>
          )}
        </div>
      </Form>
      {visible && <SelectModal visible={visible} onClose={() => setVisible(!visible)} />}
    </Container>
  );
};

export default Form.create<EditProps>()(Edit);
