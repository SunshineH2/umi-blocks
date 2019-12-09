import React, { useEffect, useState, useCallback } from 'react';
import { FormComponentProps } from 'antd/lib/form';
import {
  Form,
  Input,
  Select,
  Button,
  TreeSelect,
  Col,
  Row,
  message,
  InputNumber,
  Modal,
  Radio,
} from 'antd';
import router from 'umi/router';
import styles from './index.module.less';
import { PageBasicPropsModel, CustomWindow } from '../interfaces/common';
import { TreeNode } from 'antd/lib/tree-select';
import { Container } from '@td-design/web';
import { TYPE_LIST } from '../constant';

const FormItem = Form.Item;
const { Option } = Select;
const TextArea = Input.TextArea;
const { confirm } = Modal;

const formItemLayout = {
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 12,
  },
};
const descLayout = {
  labelCol: {
    span: 3,
  },
  wrapperCol: {
    span: 18,
  },
};

interface ResourceFormProps extends PageBasicPropsModel, FormComponentProps {}

const ResourceForm: React.FC<ResourceFormProps> = props => {
  const { getFieldDecorator, setFieldsValue } = props.form;
  const [isCreate, setIsCreate] = useState<boolean>(true);
  const [id, setId] = useState<string>('');
  const [menu, setMenu] = useState<TreeNode[]>([]);
  const [typeValue, setTypeValue] = useState<number | undefined>(undefined);
  const [values, setValues] = useState<defs.authorization.ResourceDetails>(API.authorization.resource.detail.init);

  const treeFormatter = useCallback((list: defs.authorization.ResourceTreeObject[]) => {
    const data: TreeNode[] = [];
    list.map((item: defs.authorization.ResourceTreeObject) => {
      if (!item.children) {
        data.push({
          title: item.description!,
          value: item.id!,
          key: item.id!,
        });
      } else {
        data.push({
          title: item.description!,
          value: item.id!,
          key: item.id!,
          children: treeFormatter(item.children),
        });
      }
    });
    return data;
  }, []);

  /** 获取父级菜单 */
  const fetchMenu = useCallback(async () => {
    try {
      const response = await API.authorization.resource.listTree.fetch({
        clientKey: ((window as unknown) as CustomWindow).authConfig.client_id,
      });
      setMenu(treeFormatter(response.data));
    } catch (error) {
      message.error(error.message);
    }
  }, [treeFormatter]);

  const fetchDetail = useCallback(
    async (id: number) => {
      try {
        const response = await API.authorization.resource.detail.fetch({ id });
        const { parentId } = response.data;
        setValues({ ...response.data, parentId: parentId ? parentId : undefined });
        setTypeValue(response.data.isVisible);
      } catch (error) {
        message.error(error.message);
      }
    },
    [setFieldsValue],
  );

  useEffect(() => {
    fetchMenu();
    const { id } = props.location.query;
    if (id) {
      setIsCreate(false);
      setId(id);
      fetchDetail(+id);
    }
  }, [fetchMenu, props.location.query, fetchDetail]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    props.form.validateFields(async (err, values) => {
      if (!err) {
        try {
          values = id ? { ...values, id } : values;
          await API.authorization.resource.newResource.fetch({
            ...values,
            clientKey: ((window as unknown) as CustomWindow).authConfig.client_id,
          });
          message.success(`${id ? '编辑' : '新增'}资源成功`);
          router.push({ pathname: '/resource' });
        } catch (err) {
          message.error(err.message);
        }
      }
    });
  };

  const deleteConfirm = () => {
    confirm({
      title: '确定删除资源么？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await API.authorization.resource.deleteResource.fetch({
            clientKey: ((window as unknown) as CustomWindow).authConfig.client_id,
            id,
          });
          message.success('删除成功!');
          router.push({ pathname: '/resource' });
        } catch (error) {
          message.error(error.message);
        }
      },
    });
  };

  return (
    <Container header={isCreate ? '新建资源' : '编辑资源'} style={{ fontSize: '16px' }}>
      <Form onSubmit={handleSubmit} {...formItemLayout}>
        <Row>
          <Col span={12}>
            <FormItem label="父级菜单">
              {getFieldDecorator('parentId', {
                initialValue: values.parentId,
              })(<TreeSelect allowClear treeData={menu} />)}
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem label="资源顺位">
              {getFieldDecorator('orderValue', {
                initialValue: values.orderValue,
              })(<InputNumber min={1} style={{ width: '100%' }} />)}
            </FormItem>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <FormItem label="资源标识">
              {getFieldDecorator('resourceKey', {
                rules: [
                  {
                    required: true,
                    message: '请输入资源标识',
                  },
                ],
                initialValue: values.resourceKey
              })(<Input placeholder="资源标识不能重复" />)}
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem label="拓展字段">
              {getFieldDecorator('resourceBusinessValue', {
                initialValue: values.resourceBusinessValue,
              })(<Input />)}
            </FormItem>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <FormItem label="资源URL">
              {getFieldDecorator('apiUrl', {
                rules: [
                  {
                    required: true,
                    message: '请输入资源URL',
                  },
                ],
                initialValue: values.apiUrl
              })(<Input />)}
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem label="图标">{getFieldDecorator('icon', {
              initialValue: values.icon,
            })(<Input />)}</FormItem>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <FormItem label="资源类型">
              {getFieldDecorator('type', {
                rules: [
                  {
                    required: true,
                    message: '请选择资源类型',
                  },
                ],
                initialValue: values.type
              })(
                <Select allowClear onChange={(value: number) => setTypeValue(value)}>
                  {TYPE_LIST.map(item => (
                    <Option key={item.value} value={item.value}>
                      {item.title}
                    </Option>
                  ))}
                </Select>,
              )}
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem label="资源码">{getFieldDecorator('permissionCode', {
              initialValue: values.permissionCode,
            })(<Input />)}</FormItem>
          </Col>
        </Row>
        {typeValue === 0 && (
          <Row>
            <Col span={12}>
              <FormItem label="菜单是否可见">
                {getFieldDecorator('isVisible', {
                  rules: [
                    {
                      required: true,
                      message: '请选择',
                    },
                  ],
                  initialValue: values.isVisible
                })(
                  <Radio.Group>
                    <Radio value={1}>是</Radio>
                    <Radio value={0}>否</Radio>
                  </Radio.Group>,
                )}
              </FormItem>
            </Col>
          </Row>
        )}
        <Row>
          <Col span={24}>
            <FormItem label="资源描述" {...descLayout}>
              {getFieldDecorator('description', {
                rules: [
                  {
                    required: true,
                    message: '请输入资源描述',
                  },
                ],
                initialValue: values.description
              })(<TextArea />)}
            </FormItem>
          </Col>
        </Row>
        <div className={styles.buttonWrap}>
          <Button className={styles.button} onClick={() => router.push({ pathname: '/resource' })}>
            取消
          </Button>
          {!isCreate && (
            <Button className={styles.button} type="danger" ghost onClick={deleteConfirm}>
              删除资源
            </Button>
          )}
          <Button type="primary" htmlType="submit" className={styles.button}>
            提交
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default Form.create<ResourceFormProps>()(ResourceForm);
