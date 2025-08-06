import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useParams, Link, useNavigate, useLocation } from "react-router";
import {
  Spin,
  Alert,
  Card,
  Rate,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Form,
  Input,
  message,
} from "antd";
import { useStore } from "../../hooks/useStore";
import type { PhoneReview } from "../../stores/PhoneStore";
import { requireAuth } from "../../utils/auth";

const { Title, Paragraph, Text } = Typography;

export const PhoneDetailPage = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    phoneStore: { currentPhone: phone, loading, error, getPhoneById, addToCart, addToWishlist, addReview },
  } = useStore();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) getPhoneById(id);
  }, [id, getPhoneById]);

  const handleAddToCart = async () => {
    if (!id) return;
    

    if (!requireAuth(navigate, location.pathname)) {
      return;
    }

    try {
      await addToCart(id);
      message.success('Added to cart successfully');
    } catch (error) {
      message.error('Failed to add to cart');
    }
  };

  const handleAddToWishlist = async () => {
    if (!id) return;


    if (!requireAuth(navigate, location.pathname)) {
      return;
    }

    try {
      await addToWishlist(id);
      message.success('Added to wishlist successfully');
    } catch (error) {
      message.error('Failed to add to wishlist');
    }
  };

  const handleReviewSubmit = async (values: { rating: number; comment: string }) => {
    if (!id) return;


    if (!requireAuth(navigate, location.pathname)) {
      return;
    }

    try {
      await addReview(id, values);
      message.success('Review submitted successfully');
      form.resetFields();
      // Refresh phone data to show new review
      getPhoneById(id);
    } catch (error) {
      message.error('Failed to submit review');
    }
  };

  if (loading) return <Spin style={{ margin: "100px auto", display: "block" }} />;
  if (error) return <Alert type="error" message={error} />;
  if (!phone) return <Alert type="warning" message="Phone not found" />;

  const API_URL = import.meta.env.VITE_API_URL;
  let imgUrl = `${API_URL}/default.jpg`;
  if (phone.image && typeof phone.image === 'string') {
    imgUrl = phone.image.startsWith("images/")
      ? `${API_URL}/${phone.image}`
      : `${API_URL}/${phone.image}`;
  }

  return (
    <div style={{ maxWidth: 800, margin: "24px auto", padding: 16 }}>
      <Title level={2}>{phone.title}</Title>
      <Text type="secondary">
        Brand: {phone.brand} | Price: ${phone.price} | In stock: {phone.stock}
      </Text>

      <div style={{ margin: "8px 0" }}>
      <Text strong>Seller:</Text>{" "}
        {phone.seller.firstName} {phone.seller.lastName}
      </div>

      <Row gutter={16} align="middle" style={{ marginBottom: 24 }}>
        <Col span={12}>
          <img
            src={imgUrl}
            alt={phone.title}
            style={{ width: "100%", borderRadius: 8 }}
          />
        </Col>
        <Col span={12}>
          <Space direction="vertical" size="middle">
            <Button type="primary" onClick={handleAddToCart}>
              Add to Cart
            </Button>
            <Button onClick={handleAddToWishlist}>Add to Wishlist</Button>
          </Space>
        </Col>
      </Row>

      <Title level={4} style={{ margin: "24px 0 8px" }}>
        Reviews
      </Title>
      {Array.isArray(phone.reviews) && phone.reviews.length > 0 ? (
        phone.reviews.map((r: PhoneReview) => (
          <div key={r._id} style={{ marginBottom: 16 }}>
            <Rate disabled defaultValue={r.rating} />
            <Paragraph
              ellipsis={
                !expanded[r._id]
                  ? {
                      rows: 2,
                      expandable: true,
                      symbol: "Show more",
                      onExpand: () =>
                        setExpanded((prev) => ({ ...prev, [r._id]: true })),
                    }
                  : false
              }
            >
              {r.comment}
            </Paragraph>
          </div>
        ))
      ) : (
        <Text type="secondary">No reviews yet.</Text>
      )}

      <div style={{ marginTop: 32 }}>
        <Title level={5}>Leave a Comment</Title>
        <Form
          form={form}
          onFinish={handleReviewSubmit}
          layout="vertical"
        >
          <Form.Item name="rating" label="Rating" initialValue={5}>
            <Rate />
          </Form.Item>
          <Form.Item
            name="comment"
            label="Comment"
            rules={[{ required: true, message: "Please enter your comment" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit Comment
            </Button>
          </Form.Item>
        </Form>
      </div>

      <div style={{ marginTop: 24 }}>
        <Link to="/">← Back to Home</Link>
      </div>
    </div>
  );
});