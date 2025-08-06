import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Table, Space, Button, Typography, message, InputNumber } from "antd";
import { useStore } from "../../hooks/useStore";
import { useNavigate } from "react-router";
import type { ColumnsType } from "antd/es/table";

const { Title } = Typography;

interface RowType {
  key:      string;
  phoneId:  string;
  title:    string;
  price:    number;
  quantity: number;
  stock:    number;
}

export const CheckoutPage: React.FC = observer(() => {
  const navigate = useNavigate();
  const { cartStore } = useStore();
  const { cart, fetchCart, removeItem, updateQuantity, clearCart, makeOrder } = cartStore;

  useEffect(() => {
    fetchCart().catch(err => message.error(err.message));
  }, []);

  // map the cart to a dataSource with stock
  const dataSource: RowType[] = cart.map(item => ({
    key:      item.phoneId,
    phoneId:  item.phoneId,
    title:    item.title,
    price:    item.price,
    quantity: item.quantity,
    stock:    item.stock,
  }));

  const handleUpdateQuantity = async (phoneId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      await handleRemoveItem(phoneId);
      return;
    }
    try {
      await updateQuantity(phoneId, newQuantity);
    } catch (error) {
      message.error('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (phoneId: string) => {
    try {
      await removeItem(phoneId);
    } catch (error) {
      message.error('Failed to remove item');
    }
  };

  // configure columns, and perform a secondary verification and disable it in the + button
  const columns: ColumnsType<RowType> = [
    { title: "Product", dataIndex: "title", key: "title" },
    { title: "Unit Price", dataIndex: "price", key: "price", render: p => <span style={{ color: '#1677ff', fontWeight: 500 }}>${p.toFixed(2)}</span> },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (q, record) => (
        <InputNumber
          min={0}
          max={record.stock}
          value={q}
          onChange={val => handleUpdateQuantity(record.phoneId, Number(val))}
          style={{ width: 80, borderRadius: 8 }}
        />
      )
    },
    {
      title: "Subtotal",
      key: "subtotal",
      render: (_, record) => <strong>${(record.price * record.quantity).toFixed(2)}</strong>
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button 
          danger 
          size="middle" 
          style={{ borderRadius: 8 }}
          onClick={() => handleRemoveItem(record.phoneId)}
        >
          Remove
        </Button>
      )
    }
  ];

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handlePlaceOrder = async () => {
    try {
      await makeOrder();
      await clearCart();
      await fetchCart(); // Refresh cart data after clearing
      message.success("Order placed!");
      navigate("/");
    } catch (error) {
      message.error('Failed to place order');
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: '#f5f7fa', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 0, overflowX: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: 1200, margin: '56px auto 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ borderRadius: 24, boxShadow: '0 8px 32px rgba(22,119,255,0.06)', background: '#fff', width: '100%', padding: '56px 56px 40px 56px', border: 'none', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
            <span style={{ fontSize: 36, color: '#1677ff', marginRight: 20 }}>🛒</span>
            <Title level={2} style={{ margin: 0, fontSize: 32 }}>Shopping Cart</Title>
          </div>
          <div style={{ borderTop: '1.5px solid #f0f0f0', marginBottom: 40 }} />
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 100, fontSize: 20, color: '#888' }}>Your cart is empty</div>
          ) : (
            <>
              <Table
                dataSource={dataSource}
                columns={columns}
                pagination={false}
                rowClassName="cart-row"
                style={{ background: '#fff', borderRadius: 18, marginBottom: 0, fontSize: 18 }}
                bordered
                size="large"
                scroll={undefined}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 40 }}>
                <span style={{ fontSize: 26, fontWeight: 700, marginRight: 40 }}>Total: ${total.toFixed(2)}</span>
                <Button
                  type="primary"
                  size="large"
                  style={{ borderRadius: 12, minWidth: 200, fontWeight: 700, fontSize: 20, boxShadow: '0 2px 8px rgba(22,119,255,0.10)' }}
                  onClick={handlePlaceOrder}
                  disabled={cart.length === 0}
                >
                  Place Order
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default CheckoutPage;
