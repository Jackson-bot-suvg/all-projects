import React, { useEffect, useState } from 'react';
import { Table, Switch, Spin, Typography, Alert } from 'antd';
const { Title } = Typography;
import { profileStore } from '../../stores/ProfileStore';
import { observer } from 'mobx-react-lite';

type Reviewer = {
  firstname: string;
  lastname: string;
  email: string;
};

type Review = {
  _id: string;
  reviewer: Reviewer;
  rating: number;
  comment: string;
  hidden: boolean;
  createdAt: string;
};

type Listing = {
  _id: string;
  title: string;
  reviews: Review[];
};

type FlatReview = {
  key: string;
  listingTitle: string;
  comment: string;
  hidden: boolean;
  listingId: string;
  reviewId: string;
};

const ViewComments: React.FC = () => {
  const [data, setData] = useState<FlatReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/users/my-written-reviews`, { credentials: 'include' })
      .then(async (res) => {
        let data;
        try {
          data = await res.json();
        } catch (e) {
          setData([]); 
          setError(null); 
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError(data.message || 'Failed to fetch');
          setData([]);
          setLoading(false);
          return;
        }
        setData(
          (data as any[]).map((review) => ({
            key: review._id,
            listingTitle: review.listingTitle,
            brand: review.brand,
            rating: review.rating,
            comment: review.comment,
            hidden: review.hidden,
            createdAt: review.createdAt,
            listingId: review.listingId,
            reviewId: review._id,
          }))
        );
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch');
        setData([]);
        setLoading(false);
      });
  }, []);

  const handleToggle = async (listingId: string, reviewId: string) => {
    try {
      const res = await fetch(
        `/api/users/listings/${listingId}/reviews/${reviewId}/toggle-visibility`,
        {
          method: 'PUT',
          credentials: 'include',
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to toggle');
      }
      const dataRes = await res.json();
      setData((prev) =>
        prev.map((item) =>
          item.listingId === listingId && item.reviewId === reviewId
            ? { ...item, hidden: dataRes.hidden }
            : item
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to toggle');
    }
  };

  const columns = [
    {
      title: 'Listing',
      dataIndex: 'listingTitle',
      key: 'listingTitle',
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
    },
    {
      title: 'Visible',
      dataIndex: 'hidden',
      key: 'hidden',
      render: (hidden: boolean) => (hidden ? 'Hidden' : 'Visible'),
      width: 120,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>My Written Comments</Title>
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        locale={{ emptyText: 'No data' }}
        pagination={false}
        bordered
      />
    </div>
  );
};

export default ViewComments;