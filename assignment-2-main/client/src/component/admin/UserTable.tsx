import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { Table, Spin, Typography, Space, Button, Modal, Form, Input, Switch, message, Select } from 'antd';
import { EditOutlined, ShopOutlined, CommentOutlined, SearchOutlined } from '@ant-design/icons';
import { useStore } from '../../hooks/useStore';
import type { UserRecord } from '../../stores/AdminStore';
import type { TablePaginationConfig } from 'antd/es/table';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';
import { useNavigate } from 'react-router';;
import UserReviewTable from './UserReviewTable';

const { Title } = Typography;

export const UserTable: React.FC = observer(() => {
    const navigate = useNavigate();
    const { adminStore } = useStore();
    const { filteredUsers, loading, error, searchTerm } = adminStore;
    const [editModalVisible, setEditModalVisible] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<UserRecord | null>(null);
    const [reviewModalVisible, setReviewModalVisible] = React.useState(false);
    const [selectedUserForReview, setSelectedUserForReview] = React.useState<UserRecord | null>(null);
    const [form] = Form.useForm();

    React.useEffect(() => { 
        adminStore.getUsers({
            sortField: adminStore.userSortField,
            sortOrder: adminStore.userSortOrder,
            verified: adminStore.userVerifiedFilter,
            disabled: adminStore.userDisabledFilter
        }); 
    }, [
        adminStore,
        adminStore.userSortField,
        adminStore.userSortOrder,
        adminStore.userVerifiedFilter,
        adminStore.userDisabledFilter
    ]);

    const handleTableChange = (
        pagination: TablePaginationConfig,
        filters: Record<string, FilterValue | null>,
        sorter: SorterResult<UserRecord> | SorterResult<UserRecord>[]
    ) => {
        if (pagination.current) {
            adminStore.setCurrentPage(pagination.current);
        }

        if ('field' in sorter && 'order' in sorter) {
            adminStore.setUserSort(
                sorter.field as string,
                sorter.order === 'descend' ? 'desc' : 'asc'
            );
        }
    };

    const handleEdit = (user: UserRecord) => {
        setSelectedUser(user);
        form.setFieldsValue({
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            disabled: user.disabled
        });
        setEditModalVisible(true);
    };

    const handleUpdate = async (values: any) => {
        if (!selectedUser) return;
        
        try {
            await adminStore.updateUser(selectedUser._id, values);
            message.success('User updated successfully');
            setEditModalVisible(false);
            form.resetFields();
        } catch (error: any) {
            message.error(error.message || 'Failed to update user');
        }
    };

    if (loading) return <Spin />;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    const columns = [
        { 
            title: 'Full Name', 
            dataIndex: 'firstname', 
            key: 'name', 
            render: (_: any, record: UserRecord) => `${record.firstname} ${record.lastname}` 
        },
        { 
            title: 'Email', 
            dataIndex: 'email', 
            key: 'email' 
        },
        { 
            title: 'Created At', 
            dataIndex: 'createdAt', 
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
            sorter: true,
            defaultSortOrder: 'descend' as 'descend',
            showSorterTooltip: { title: 'Click to sort by creation date' }
        },
        { 
            title: 'Last Login', 
            dataIndex: 'lastLogin', 
            key: 'lastLogin',
            render: (date: string) => date ? new Date(date).toLocaleDateString() : 'Never',
            sorter: true,
            showSorterTooltip: { title: 'Click to sort by last login time' }
        },
        {
            title: 'Verified',
            dataIndex: 'verified',
            key: 'verified',
            render: (verified: boolean) => (
                <Switch checked={verified} disabled />
            )
        },
        {
            title: 'Status',
            dataIndex: 'disabled',
            key: 'status',
            render: (disabled: boolean) => (
                <span style={{ color: disabled ? '#ff4d4f' : '#52c41a' }}>
                    {disabled ? 'Disabled' : 'Active'}
                </span>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: UserRecord) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        title="Edit user"
                    />
                    <Button
                        type="text"
                        icon={<ShopOutlined />}
                        onClick={() => navigate(`/admin/listings?userId=${record._id}`)}
                        title="View user listings"
                    />
                    <Button
                        type="text"
                        icon={<CommentOutlined />}
                        onClick={() => {
                            setSelectedUserForReview(record);
                            setReviewModalVisible(true);
                        }}
                        title="View user reviews"
                    />
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Title level={2}>User Management</Title>
                
                <Space>
                    <Input
                        placeholder="Search by name or email..."
                        prefix={<SearchOutlined />}
                        value={searchTerm}
                        onChange={(e) => {
                            const value = e.target.value;
                            adminStore.setSearchTerm(value);
                        }}
                        style={{ width: 250 }}
                        allowClear
                    />
                    <Select
                        placeholder="Verification Status"
                        style={{ width: 150 }}
                        allowClear
                        value={adminStore.userVerifiedFilter}
                        onChange={(value) => adminStore.setUserVerifiedFilter(value)}
                        options={[
                            { label: 'Verified', value: 'true' },
                            { label: 'Unverified', value: 'false' }
                        ]}
                    />
                    <Select
                        placeholder="Account Status"
                        style={{ width: 150 }}
                        allowClear
                        value={adminStore.userDisabledFilter}
                        onChange={(value) => adminStore.setUserDisabledFilter(value)}
                        options={[
                            { label: 'Active', value: 'false' },
                            { label: 'Disabled', value: 'true' }
                        ]}
                    />
                </Space>

                <Table
                    rowKey="_id"
                    dataSource={filteredUsers}
                    columns={columns}
                    onChange={handleTableChange}
                    pagination={{
                        current: adminStore.currentPage,
                        total: filteredUsers.length,
                        pageSize: 10,
                        showSizeChanger: false,
                        showQuickJumper: true,
                        showTotal: (total) => `Total ${total} items`
                    }}
                    locale={{ emptyText: 'No users available' }}
                />
            </Space>

            <Modal
                title="Edit User"
                open={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdate}
                >
                    <Form.Item
                        name="firstname"
                        label="First Name"
                        rules={[{ required: true, message: 'Please input first name' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="lastname"
                        label="Last Name"
                        rules={[{ required: true, message: 'Please input last name' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Please input email' },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                        extra="Changing email will require re-verification"
                    >
                        <Input />
                    </Form.Item>

                    {selectedUser && (
                        <Form.Item label="Verification Status">
                            <span>{selectedUser.verified ? 'Verified' : 'Unverified'}</span>
                        </Form.Item>
                    )}

                    <Form.Item
                        name="disabled"
                        label="Disable User"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                Save Changes
                            </Button>
                            <Button onClick={() => {
                                setEditModalVisible(false);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={`Reviews of ${selectedUserForReview?.firstname} ${selectedUserForReview?.lastname}`}
                open={reviewModalVisible}
                onCancel={() => setReviewModalVisible(false)}
                footer={null}
                width={800}
                destroyOnClose
            >
                {selectedUserForReview && (
                    <UserReviewTable
                        userId={selectedUserForReview._id}
                        userName={`${selectedUserForReview.firstname} ${selectedUserForReview.lastname}`}
                        onClose={() => setReviewModalVisible(false)}
                    />
                )}
            </Modal>
        </div>
    );
});

export default UserTable;