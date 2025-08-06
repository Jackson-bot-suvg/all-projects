import React from 'react';
import { Outlet } from 'react-router';
import TransactionNotifier from '../../component/admin/TransactionNotifier';
import { message } from 'antd';

/**
 * AdminPage only renders its child admin table.
 * Sidebar handles which table (users/orders/listings/reviews) to show.
 */
const AdminPage: React.FC = () => {
    const [messageApi, contextHolder] = message.useMessage();

    return (
        <>
            {contextHolder}
            <TransactionNotifier messageApi={messageApi}/>
            <Outlet />
        </>
    );
};

export default AdminPage;
