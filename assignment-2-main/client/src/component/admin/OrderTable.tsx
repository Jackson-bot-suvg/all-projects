import { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Table, Spin, Typography, Space, Select, Button } from 'antd';

import { useStore } from '../../hooks/useStore';
import { FilterValue, SorterResult, TablePaginationConfig } from 'antd/es/table/interface';
import { ListingRecord } from '../../stores/AdminStore';

const { Title } = Typography;

export const OrderTable: React.FC = observer(() => {
    const { adminStore } = useStore();
    const { 
        transactions, 
        loading, 
        getTransactions, 
        setTransactionSort, 
        transactionFilters, 
        transactionPage,
        setTransactionPage,
        // uniqueBuyers,
        // buyerFilter,
        exportTransactionCSV,
    } = adminStore;
    const {sortField, sortOrder} = transactionFilters;

    useEffect(() => { getTransactions(); }, [getTransactions, transactionFilters]);
    if (loading) return <Spin />;

    // const uniqueBuyers = useMemo(() => {
    //     return Array.from(new Set(
    //         transactions.map(transaction => 
    //             `${transaction.buyer.firstname} ${transaction.buyer.lastname}`
    //         )
    //     )).map(name => ({ text: name, value: name }));
    // }, [transactions]);


    const handleTableChange = (
        pagination: TablePaginationConfig,
        filters: Record<string, FilterValue | null>,
        sorter: SorterResult<ListingRecord> | SorterResult<ListingRecord>[]
    ) => {
        if (pagination.current) {
            setTransactionPage(pagination.current);
        }

        if ('field' in sorter && 'order' in sorter) {
            let sortDirection;
            switch (sorter.order) {
                case 'descend':
                    sortDirection = 'desc';
                    break;
                case 'ascend':
                    sortDirection = 'asc';
                    break;
                default:
                    sortDirection = undefined;
            }

            setTransactionSort(
                sorter.field as string,
                sortDirection
            );
        }

        // console.log(filters);
    };

    const columns = [
        { 
            title: 'Order ID', 
            dataIndex: '_id', 
            key: '_id' 
        },
        { 
            title: 'Timestamp', 
            dataIndex: 'createdAt', 
            key: 'timestamp', 
            render: (timestamp) => `${(new Date(timestamp).toLocaleString())}`, 
            sorter: true, defaultSortOrder: 'descend', 
            sortOrder: sortField === 'createdAt' ? (sortOrder === 'desc' ? 'descend' : sortOrder === 'asc' ? 'ascend' : null) : null
        },
        { 
            title: 'Buyer', 
            dataIndex: 'buyer', 
            key: 'buyer', 
            render: (buyer) => `${buyer.firstname} ${buyer.lastname}`,
            // filters: uniqueBuyers, 
            // filteredValue: buyerFilter ? [buyerFilter] : null,
            // onFilter: (value, record) => `${record.buyer.firstname} ${record.buyer.lastname}` === value,
        },
        { 
            title: 'Total Amount', 
            dataIndex: 'totalPrice', 
            key: 'totalPrice', 
            render: (t: number) => `$${t.toFixed(2)}`, 
            sorter: true, 
            sortOrder: sortField === 'totalPrice' ? (sortOrder === 'desc' ? 'descend' : sortOrder === 'asc' ? 'ascend' : null) : null
        }
    ] as const;

    return (
        <div style={{ padding: 24 }}>
            <Space direction="horizontal" style={{ width: '100%', justifyContent: "space-between", alignItems: "center"}} size="large">
                <Title level={2}>Order Logs</Title>
                <Button onClick={exportTransactionCSV}>Export to CSV</Button>
            </Space>
            <Table
                onChange={handleTableChange}
                rowKey="_id"
                dataSource={transactions.map(o => ({ ...o, key: o._id }))}
                columns={columns}
                pagination={{ pageSize: 10, current: transactionPage } as import('antd').TablePaginationConfig}
                expandable={{ expandedRowRender: record => (
                        <ul>
                            {record.items.map(item => (
                                <li key={item.name}>{item.quantity} x {item.name}</li>
                            ))}
                        </ul>
                    ) }}
                locale={{ emptyText: 'No orders available' }}
            />
        </div>
    );
});

export default OrderTable;