import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Table,
  Switch,
  Button,
  Spin,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm
} from 'antd';
import { observer } from 'mobx-react-lite';
import { profileStore } from '../../stores/ProfileStore';

const { Title } = Typography;

const ManageListings: React.FC = observer(() => {
  /* -------------- data -------------- */
  useEffect(() => {
    profileStore.fetchListings();
  }, []);

  /* -------------- modal & form -------------- */
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const openModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      const ok = await profileStore.createListing(values);
      if (ok) {
        message.success('Listing created');
        setIsModalVisible(false);
      }
    } catch {
      
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await profileStore.deleteListing(id);
    if (ok) message.success('Listing deleted');
  };

  /* -------------- table -------------- */
  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Brand', dataIndex: 'brand', key: 'brand' },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (v: number) => `$${v}`
    },
    { title: 'Stock', dataIndex: 'stock', key: 'stock' },
    {
      title: 'Enabled',
      dataIndex: 'disabled',
      key: 'enabled',
      render: (_: any, rec: any) => (
        <Switch
          checked={!rec.disabled}
          onChange={() => profileStore.toggleListing(rec._id)}
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, rec: any) => (
        <Popconfirm
          title="Delete this listing?"
          onConfirm={() => handleDelete(rec._id)}
        >
          <Button danger loading={profileStore.loading}>
            Delete
          </Button>
        </Popconfirm>
      )
    }
  ];

  /* -------------- render -------------- */
  if (profileStore.loading && profileStore.listings.length === 0) return <Spin />;

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>My Listings</Title>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={openModal}>
          Add New Listing
        </Button>
      </Space>

      <Table
        rowKey="_id"
        dataSource={profileStore.listings}
        columns={columns as any}
        pagination={{ pageSize: 5 }}
        loading={profileStore.loading}
      />

      <Modal
        title="Add New Listing"
        open={isModalVisible}
        onOk={handleAdd}
        confirmLoading={profileStore.loading}
        onCancel={() => setIsModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Title is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Brand"
            name="brand"
            rules={[{ required: true, message: 'Brand is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Stock"
            name="stock"
            rules={[
              { required: true, message: 'Stock is required' },
              { type: 'number', min: 0, message: 'Stock must be ≥ 0' }
            ]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Price"
            name="price"
            rules={[
              { required: true, message: 'Price is required' },
              { type: 'number', min: 0, message: 'Price must be ≥ 0' }
            ]}
          >
            <InputNumber style={{ width: '100%' }} step={0.01} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});

export default ManageListings;