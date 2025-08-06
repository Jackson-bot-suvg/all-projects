import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { 
    Table, 
    Spin, 
    Typography, 
    Space, 
    Button, 
    Modal, 
    Form, 
    Input, 
    InputNumber, 
    Switch, 
    message,
    Select,
    Slider,
    Card,
    Row,
    Col,
    Divider
} from 'antd';
import { EditOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { useStore } from '../../hooks/useStore';
import type { ListingRecord } from '../../stores/AdminStore';
import { TablePaginationConfig } from 'antd/es/table';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';
import { useSearchParams } from 'react-router';

const { Title } = Typography;

export const ListingTable: React.FC = observer(() => {
    const { adminStore } = useStore();
    const { filteredListings, loading, error, listingSearchTerm } = adminStore;
    const [editModalVisible, setEditModalVisible] = React.useState(false);
    const [selectedListing, setSelectedListing] = React.useState<ListingRecord | null>(null);
    const [form] = Form.useForm();
    const DEFAULT_MAX = 1_000_000_000; //
    const [priceRange, setPriceRange] = React.useState<[number, number]>([
        0,
        adminStore.maxListingPrice || DEFAULT_MAX
    ]);
    const [hasTouchedPrice, setHasTouchedPrice] = React.useState(false); 
    const [isDragging, setIsDragging] = React.useState(false);
    const debouncedPriceRange = React.useRef<[number, number]>([0, 10000]);
    const skipEffect = React.useRef(false);
    const [searchParams] = useSearchParams();
    const userIdParam = searchParams.get('userId') ?? undefined; 

    // Debounced function to update listings when price range changes
    const debouncedGetListings = React.useCallback(
        debounce((range: [number, number]) => {
            const payload: any = {
                sortField: adminStore.listingSortField,
                sortOrder: adminStore.listingSortOrder,
                brand: adminStore.listingBrandFilter,
                disabled: adminStore.listingDisabledFilter,
                minPrice: range[0],
                userId: userIdParam
            };
            if (hasTouchedPrice) payload.maxPrice = range[1]; 
            adminStore.getListings(payload);
        }, 500),
        [adminStore, hasTouchedPrice]
    );

    React.useEffect(() => {
        if (!isDragging) {
            debouncedGetListings(priceRange);
        }
    }, [priceRange, isDragging, debouncedGetListings]);

    React.useEffect(() => {
        // Initial load
        adminStore.getListings({
            sortField: adminStore.listingSortField,
            sortOrder: adminStore.listingSortOrder,
            brand: adminStore.listingBrandFilter,
            disabled: adminStore.listingDisabledFilter,
            minPrice: 0,
            userId: userIdParam
        });
    }, [adminStore, userIdParam]);

    React.useEffect(() => {
        const max = adminStore.maxListingPrice || DEFAULT_MAX;
        if (max !== priceRange[1]) { 
            setPriceRange(prev => [prev[0], max]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminStore.maxListingPrice]);

    const handleTableChange = (
        pagination: TablePaginationConfig,
        filters: Record<string, FilterValue | null>,
        sorter: SorterResult<ListingRecord> | SorterResult<ListingRecord>[]
    ) => {
        if (pagination.current) {
            adminStore.setListingCurrentPage(pagination.current);
        }

        if ('field' in sorter && 'order' in sorter) {
            adminStore.setListingSort(
                sorter.field as string,
                sorter.order === 'descend' ? 'desc' : 'asc'
            );
        }
    };

    const handleEdit = (listing: ListingRecord) => {
        setSelectedListing(listing);
        form.setFieldsValue({
            title: listing.title,
            brand: listing.brand,
            price: listing.price,
            stock: listing.stock,
            disabled: listing.disabled
        });
        setEditModalVisible(true);
    };

    const handleUpdate = async (values: any) => {
        if (!selectedListing) return;
        
        try {
            await adminStore.updateListing(selectedListing._id, values);
            message.success('Listing updated successfully');
            setEditModalVisible(false);
            form.resetFields();
        } catch (error: any) {
            message.error(error.message || 'Failed to update listing');
        }
    };

    if (loading) return <Spin />;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    const columns = [
        { 
            title: 'Title', 
            dataIndex: 'title', 
            key: 'title' 
        },
        { 
            title: 'Brand', 
            dataIndex: 'brand', 
            key: 'brand'
        },
        { 
            title: 'Price', 
            dataIndex: 'price', 
            key: 'price',
            render: (price: number) => `$${price.toFixed(2)}`,
            sorter: true
        },
        { 
            title: 'Stock', 
            dataIndex: 'stock', 
            key: 'stock',
            sorter: true
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
            render: (_: any, record: ListingRecord) => (
                <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                    title="Edit listing"
                />
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Title level={2}>Listing Management</Title>
                
                <Card size="small">
                    <Space wrap>
                        <Input
                            placeholder="Search by title or brand..."
                            prefix={<SearchOutlined />}
                            value={listingSearchTerm}
                            onChange={(e) => adminStore.setListingSearchTerm(e.target.value)}
                            style={{ width: 250 }}
                            allowClear
                        />
                        <Select
                            placeholder="Filter by Brand"
                            style={{ width: 200 }}
                            allowClear
                            value={adminStore.listingBrandFilter}
                            onChange={(value) => adminStore.setListingBrandFilter(value)}
                            options={adminStore.uniqueBrands.map(brand => ({
                                label: brand,
                                value: brand
                            }))}
                        />
                        <Select
                            placeholder="Status"
                            style={{ width: 120 }}
                            allowClear
                            value={adminStore.listingDisabledFilter}
                            onChange={(value) => adminStore.setListingDisabledFilter(value)}
                            options={[
                                { label: 'Active', value: 'false' },
                                { label: 'Disabled', value: 'true' }
                            ]}
                        />
                        <Space>
                            <InputNumber
                                style={{ width: 120 }}
                                prefix="$"
                                min={0}
                                max={adminStore.maxListingPrice || DEFAULT_MAX}
                                value={priceRange[0]}
                                placeholder="Min Price"
                                onChange={(value) => {
                                    if (typeof value === 'number') {
                                        setPriceRange([value, priceRange[1]]);
                                    }
                                }}
                            />
                            <span>-</span>
                            <InputNumber
                                style={{ width: 120 }}
                                prefix="$"
                                min={priceRange[0]}
                                max={5000}
                                value={priceRange[1]}
                                placeholder="Max Price"
                                onChange={(value) => {
                                    if (typeof value === 'number') {
                                        setHasTouchedPrice(true);
                                        setPriceRange([priceRange[0], value]);
                                    }
                                }}
                            />
                            <Button
                                onClick={() => {
                                    const max = adminStore.maxListingPrice || DEFAULT_MAX;
                                    skipEffect.current = true;
                                    setHasTouchedPrice(false); // 恢复"未过滤"状态
                                    setPriceRange([0, max]);
                                    adminStore.setListingCurrentPage(1);
                                    adminStore.getListings({
                                        sortField: adminStore.listingSortField,
                                        sortOrder: adminStore.listingSortOrder,
                                        brand: adminStore.listingBrandFilter,
                                        disabled: adminStore.listingDisabledFilter,
                                        minPrice: 0,
                                        userId: userIdParam
                                    });
                                }}
                            >
                                Reset Price
                            </Button>
                        </Space>
                    </Space>
                </Card>

                <Table
                    rowKey="_id"
                    dataSource={filteredListings}
                    columns={columns}
                    onChange={handleTableChange}
                    pagination={{
                        current: adminStore.listingCurrentPage,
                        total: filteredListings.length,
                        pageSize: 10,
                        showSizeChanger: false,
                        showQuickJumper: true,
                        showTotal: (total) => `Total ${total} items`
                    }}
                    locale={{ emptyText: 'No listings available' }}
                />
            </Space>

            <Modal
                title="Edit Listing"
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
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: 'Please input listing title' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="brand"
                        label="Brand"
                        rules={[{ required: true, message: 'Please input brand name' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="price"
                        label="Price"
                        rules={[
                            { required: true, message: 'Please input price' },
                            { type: 'number', min: 0, message: 'Price must be greater than or equal to 0' }
                        ]}
                    >
                        <InputNumber
                            prefix="$"
                            step={0.01}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="stock"
                        label="Stock"
                        rules={[
                            { required: true, message: 'Please input stock quantity' },
                            { type: 'number', min: 0, message: 'Stock must be greater than or equal to 0' }
                        ]}
                    >
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="disabled"
                        label="Disable Listing"
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
        </div>
    );
});

// Helper function for debouncing
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export default ListingTable;