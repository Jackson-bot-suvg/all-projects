import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useProfileStore } from '../../stores/ProfileStore';

const WishlistPage: React.FC = observer(() => {
  const { wishlist, fetchWishlist, loading, error } = useProfileStore();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  if (loading) return <p>Loading…</p>;
  if (error)   return <p>Load failed: {error}</p>;

  return (
    <div>
      <h2>My Wishlist</h2>
      {wishlist.length === 0 
        ? <p>No collection</p>
        : (
          <ul>
            {wishlist.map(item => (
              <li key={item._id}>
                {item.title} — ¥{item.price}
              </li>
            ))}
          </ul>
        )
      }
    </div>
  );
});

export default WishlistPage;
