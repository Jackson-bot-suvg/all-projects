import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { Table, Spin, Typography, Tooltip, Switch } from 'antd';
import { useStore } from '../../hooks/useStore';

const { Title } = Typography;

interface Props {
    userId: string;
    userName: string;
    onClose: () => void;
}

export const UserReviewTable: React.FC<Props> = observer(({ userId, userName }) => {
    const { adminStore } = useStore();
    const { reviews, reviewLoading, reviewError } = adminStore;

    React.useEffect(() => {
        adminStore.getReviews({ userId });
    }, [adminStore, userId]);

    const handleToggle = (listingId: string, reviewId: string, hidden: boolean) => {
        adminStore.updateReviewVisibility(listingId, reviewId, !hidden);
    };

    const columns = [
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
            render: (date: string) => new Date(date).toLocaleString()
        }
    ];

    return (
        <div>
            <Title level={4}>{userName}'s Reviews</Title>
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

export default UserReviewTable;