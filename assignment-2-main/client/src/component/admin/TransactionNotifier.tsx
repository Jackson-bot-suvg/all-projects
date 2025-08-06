import { useEffect, useState } from "react";
import { observer } from 'mobx-react-lite';
import { getRequest } from "../../utils/requests";
import { useLocation, useNavigate } from "react-router";

const TransactionNotifier = observer((messageApi: any) => {
    const [lastChecked, setLastChecked] = useState<number>(Date.now());
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecentTransactions = async () => {
            const url = `${import.meta.env.VITE_API_URL}/api/transaction/recent?startTime=${lastChecked}`;
            const transactions = await getRequest(url);

            if (Array.from(transactions).length > 0) {
                setLastChecked(Date.now());
                messageApi.messageApi.open({
                    key: transactions[0]._id,
                    type: "success",
                    content: `New transaction: ${transactions[0].buyer.firstname} ${transactions[0].buyer.lastname} made a purchase of $${transactions[0].totalPrice.toFixed(2)}`,
                    duration: 10,
                    style: {marginTop: '20px', cursor: 'pointer'},
                    onClick: () => {
                        if (location.pathname === "/admin/orders") {
                            window.location.reload();
                        } else {
                            navigate('/admin/orders')
                        }
                    }
                })
            }
        }

        fetchRecentTransactions();

        const interval = setInterval(fetchRecentTransactions, 5000);

        return () => {
            return clearInterval(interval);
        }
    }, [lastChecked]);

    return null;
})

export default TransactionNotifier;