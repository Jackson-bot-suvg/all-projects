import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { Table, Space, Typography, DatePicker, Select, Button } from 'antd';
import { useStore } from '../../hooks/useStore';
import type { TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface ActivityLog {
    _id: string;
    adminId: {
        _id: string;
        firstname: string;
        lastname: string;
        email: string;
    };
    action: string;
    targetType: string;
    targetId: string;
    details: {
        before: any;
        after: any;
    };
    timestamp: string;
    status: string;
}

export const ActivityLogTable: React.FC = observer(() => {
    const { adminStore } = useStore();
    const [dateRange, setDateRange] = React.useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const [targetType, setTargetType] = React.useState<string | null>(null);

    React.useEffect(() => {
        adminStore.getActivityLogs({
            targetType: targetType || undefined,
            startDate: dateRange?.[0]?.toISOString(),
            endDate: dateRange?.[1]?.toISOString()
        });
    }, [adminStore, targetType, dateRange]);

    const columns = [
        {
            title: 'Admin',
            dataIndex: ['adminId', 'email'],
            key: 'admin',
            render: (_: string, record: ActivityLog) => 
                `${record.adminId.firstname} ${record.adminId.lastname}`
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            filters: [
                { text: 'Create', value: 'CREATE' },
                { text: 'Update', value: 'UPDATE' },
                { text: 'Delete', value: 'DELETE' },
                { text: 'Disable', value: 'DISABLE' },
                { text: 'Enable', value: 'ENABLE' }
            ],
            onFilter: (value: string, record: ActivityLog) => record.action === value
        },
        {
            title: 'Target Type',
            dataIndex: 'targetType',
            key: 'targetType'
        },
        {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (timestamp: string) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss'),
            sorter: (a: ActivityLog, b: ActivityLog) => 
                dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf()
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Success', value: 'SUCCESS' },
                { text: 'Failure', value: 'FAILURE' }
            ],
            onFilter: (value: string, record: ActivityLog) => record.status === value
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Title level={2}>Activity Logs</Title>

                <Space>
                    <RangePicker
                        onChange={(dates) => {
                            if (dates) {
                                setDateRange([dates[0]!, dates[1]!]);
                            } else {
                                setDateRange(null);
                            }
                        }}
                    />
                    <Select
                        style={{ width: 200 }}
                        placeholder="Filter by target type"
                        allowClear
                        onChange={(value) => setTargetType(value)}
                        options={[
                            { value: 'USER', label: 'User' },
                            { value: 'LISTING', label: 'Listing' },
                            { value: 'REVIEW', label: 'Review' }
                        ]}
                    />
                    <Button onClick={() => {
                        setDateRange(null);
                        setTargetType(null);
                    }}>
                        Clear Filters
                    </Button>
                </Space>

                <Table
                    rowKey="_id"
                    dataSource={adminStore.activityLogs}
                    columns={columns}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: false,
                        showQuickJumper: true
                    } as TablePaginationConfig}
                    expandable={{
                        expandedRowRender: (record: ActivityLog) => (
                            <pre>
                                {JSON.stringify(record.details, null, 2)}
                            </pre>
                        )
                    }}
                    locale={{ emptyText: 'No activity logs available' }}
                />
            </Space>
        </div>
    );
});