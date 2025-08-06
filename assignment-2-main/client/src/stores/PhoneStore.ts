import { makeAutoObservable, runInAction } from "mobx";
import type { RootStore } from "./RootStore";
const API_URL = import.meta.env.VITE_API_URL;

export interface PhoneReview {
  _id: string;
  reviewer: string;
  rating: number;
  comment: string;
  hidden?: boolean;
}

export interface PhoneDetail {
  _id: string;
  title: string;
  brand: string;
  image: string;
  stock: number;
  seller: { _id: string; firstName: string; lastName: string };
  price: number;
  reviews: PhoneReview[];
}

export class PhoneStore {
  rootStore: RootStore;
  currentPhone: PhoneDetail | null = null;
  loading = false;
  error: string | null = null;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  getPhoneById = async (id: string) => {
    this.loading = true;
    this.error = null;
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();

      const phone: PhoneDetail = {
        _id: raw._id,
        title: raw.title,
        brand: raw.brand,
        image: raw.image,
        stock: raw.stock,
        price: raw.price,
        seller: {
          _id: raw.seller._id,
          firstName: raw.seller.firstname,
          lastName:  raw.seller.lastname,
        },
        reviews: raw.reviews.map((r: any) => ({
          _id: r._id,
          reviewer: typeof r.reviewer === "object" ? r.reviewer._id : r.reviewer,
          rating: r.rating,
          comment: r.comment,
          hidden: !!r.hidden,
        })),
      };

      runInAction(() => {
        this.currentPhone = phone;
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = e.message;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  addToCart = async (phoneId: string) => {
    const resp = await fetch(`${API_URL}/api/users/cart/add`, {
      method: 'POST',
      credentials: 'include', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneId })
    });
    if (!resp.ok) throw new Error('Failed to add to cart');
    const newCart = await resp.json();
    this.rootStore.cartStore.setCart(newCart);
    return newCart;
  };

  addToWishlist = async (phoneId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/users/wishlist/add`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneId })
        
      });
      
      if (!response.ok) throw new Error('Failed to add to wishlist');
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  addReview = async (phoneId: string, review: { rating: number; comment: string }) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${phoneId}/reviews`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(review)
        
      });
      
      if (!response.ok) throw new Error('Failed to add review');
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  };
}