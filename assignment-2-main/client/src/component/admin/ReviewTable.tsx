import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { Table, Spin, Typography, Tooltip, Switch, Input, Select, Space, Button } from 'antd';
import { useStore } from '../../hooks/useStore';

const { Title } = Typography;

export const ReviewTable: React.FC = observer(() => {
    const { adminStore } = useStore();
    const { reviews, reviewLoading, reviewError } = adminStore;

    const [brand, setBrand] = React.useState<string | undefined>();
    const [status, setStatus] = React.useState<string | undefined>();
    const [search, setSearch] = React.useState<string>('');
    const [sortField, setSortField] = React.useState<string>('createdAt');
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

    React.useEffect(() => {
        adminStore.getReviews({
            brand,
            status,
            search,
            sortField,
            sortOrder
        });
    }, [brand, status, search, sortField, sortOrder]);

    const handleToggle = (listingId: string, reviewId: string, hidden: boolean) => {
        adminStore.updateReviewVisibility(listingId, reviewId, !hidden);
    };

    const columns = [
        {
            title: 'Reviewer',
            dataIndex: 'reviewer',
            key: 'reviewer',
            render: (r: any) => r ? `${r.firstname} ${r.lastname}` : 'Anonymous',
            sorter: (a: any, b: any) => {
                const aName = (a.reviewer?.firstname + a.reviewer?.lastname).toLowerCase();
                const bName = (b.reviewer?.firstname + b.reviewer?.lastname).toLowerCase();
                return aName.localeCompare(bName);
            }
        },
        {
            title: 'Listing',
            dataIndex: 'listingTitle',
            key: 'listingTitle'
        },
        {
            title: 'Brand',
            dataIndex: 'brand',
            key: 'brand'
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating'
        },
        {
            title: 'Comment',
            dataIndex: 'comment',
            key: 'comment',
            render: (c: string) => <Tooltip title={c}>{c.length > 20 ? c.slice(0, 20) + '...' : c}</Tooltip>
        },
        {
            title: 'Visible',
            dataIndex: 'hidden',
            key: 'hidden',
            render: (hidden: boolean, record: any) => (
                <Switch
                    checked={!hidden}
                    checkedChildren="Visible"
                    unCheckedChildren="Hidden"
                    onChange={() => handleToggle(record.listingId, record._id, hidden)}
                />
            )
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleString(),
            sorter: (a: any, b: any) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>Review Management</Title>
            <Space style={{ marginBottom: 16 }}>
                <Input.Search
                    placeholder="Search by user, comment, or listing"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    allowClear
                    style={{ width: 250 }}
                />
                <Select
                    placeholder="Filter by Brand"
                    allowClear
                    style={{ width: 150 }}
                    value={brand}
                    onChange={setBrand}
                    options={[...new Set(reviews.map(r => r.brand))].map(b => ({ label: b, value: b }))}
                />
                <Select
                    placeholder="Status"
                    allowClear
                    style={{ width: 120 }}
                    value={status}
                    onChange={setStatus}
                    options={[
                        { label: 'Active', value: 'active' },
                        { label: 'Disabled', value: 'disabled' }
                    ]}
                />
                <Select
                    placeholder="Sort By"
                    value={sortField}
                    onChange={setSortField}
                    style={{ width: 120 }}
                    options={[
                        { label: 'Reviewer', value: 'reviewer' },
                        { label: 'Created At', value: 'createdAt' }
                    ]}
                />
                <Select
                    value={sortOrder}
                    onChange={v => setSortOrder(v as 'asc' | 'desc')}
                    style={{ width: 100 }}
                    options={[
                        { label: 'Asc', value: 'asc' },
                        { label: 'Desc', value: 'desc' }
                    ]}
                />
                <Button onClick={() => {
                    setBrand(undefined);
                    setStatus(undefined);
                    setSearch('');
                    setSortField('createdAt');
                    setSortOrder('desc');
                }}>
                    Reset
                </Button>
            </Space>
            {reviewLoading ? <Spin /> : (
                <Table
                    rowKey="_id"
                    dataSource={reviews}
                    columns={columns}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'No reviews available' }}
                />
            )}
            {reviewError && <div style={{ color: 'red' }}>{reviewError}</div>}
        </div>
    );
});

export default ReviewTable;
