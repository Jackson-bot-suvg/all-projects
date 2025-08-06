import { makeAutoObservable, action, runInAction } from 'mobx';
import { getRequest, postRequest } from '../utils/requests';
import authStore from './AuthStore';
import { createContext, useContext } from 'react';

/* ---------- types ---------- */
type Listing = {
  _id: string;
  title: string;
  brand: string;
  stock: number;
  price: number;
  disabled: boolean;
};

type Comment = {
  _id: string;
  listingTitle: string;
  comment: string;
  hidden: boolean;
};

type UserInfo = { firstname: string; lastname: string; email: string };

/* ---------- store ---------- */
export class ProfileStore {
  userInfo: UserInfo | null = null;
  listings: Listing[] = [];
  comments: Comment[] = [];
  wishlist: Listing[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {
      /* 标明哪些函数可被 action 包裹 */
      setUserInfo: action,
      setLoading: action,
      setError: action,
      setListings: action,
      setComments: action,
      setWishlist: action,
      reset: action
    });
  }

  /* ---------- setters ---------- */
  reset = () => {
    this.userInfo = null;
    this.listings = [];
    this.comments = [];
    this.loading = false;
    this.error = null;
  };

  setUserInfo = (data: UserInfo) => (this.userInfo = data);
  setLoading = (v: boolean) => (this.loading = v);
  setError = (msg: string | null) => (this.error = msg);
  setListings = (l: Listing[]) => (this.listings = l);
  setComments = (c: Comment[]) => (this.comments = c);
  setWishlist = (w: Listing[]) => (this.wishlist = w);

  /* ---------- user ---------- */
  fetchUserInfo = async () => {
    if (!authStore.user) return;
    this.setLoading(true);
    this.setError(null);
    try {
      const r = await getRequest(`${import.meta.env.VITE_API_URL}/api/users/me`);
      if (!r.user) throw new Error('Failed to fetch user data');
      runInAction(() =>
        this.setUserInfo({
          firstname: r.user.firstname,
          lastname: r.user.lastname,
          email: r.user.email
        })
      );
    } catch (e: any) {
      runInAction(() => {
        this.setError(e.message || 'Failed to fetch user information');
        this.setUserInfo(null);
      });
      console.error('Error fetching user info:', e);
    } finally {
      this.setLoading(false);
    }
  };

  updateProfile = async (data: UserInfo) => {
    this.setLoading(true);
    this.setError(null);
    try {
      const r = await postRequest(
        `${import.meta.env.VITE_API_URL}/api/users/update-profile`,
        data
      );
      if (!r.user) throw new Error('Failed to update profile');
      runInAction(() => {
        this.setUserInfo(r.user);
        // 同步更新AuthStore中的user信息
        const currentUser = authStore.user;
        authStore.setUser({
          ...currentUser,
          firstname: r.user.firstname,
          lastname: r.user.lastname,
          email: r.user.email
        });
      });
      return true;
    } catch (e: any) {
      this.setError(e.message || 'Failed to update profile');
      console.error('Error updating profile:', e);
      return false;
    } finally {
      this.setLoading(false);
    }
  };

  /* ---------- password ---------- */
  changePassword = async (oldPassword: string, newPassword: string) => {
    this.loading = true;
    this.error = null;
    try {
      const r = await postRequest(
        `${import.meta.env.VITE_API_URL}/api/users/change-password`,
        { oldPassword, newPassword }
      );
      return r.message === 'Password changed successfully';
    } catch (e: any) {
      this.error = e.message || 'Failed to change password. Please try again.';
      return false;
    } finally {
      this.loading = false;
    }
  };

  verifyPassword = async (password: string) => {
    this.loading = true;
    this.error = null;
    try {
      await postRequest(`${import.meta.env.VITE_API_URL}/api/users/verify-password`, {
        password
      });
      return true;
    } catch (e: any) {
      this.error = e.message;
      console.error('Error verifying password:', e);
      return false;
    } finally {
      this.loading = false;
    }
  };

  /* ---------- wishlist ---------- */
  fetchWishlist = async () => {
    if (!authStore.user) return;
    this.setLoading(true);
    this.setError(null);
    try {
      const data: Listing[] = await getRequest(
        `${import.meta.env.VITE_API_URL}/api/users/wishlist`
      );
      runInAction(() => this.setWishlist(data));
    } catch (e: any) {
      this.setError(e.message || 'Failed to load the wishlist');
      console.error('Error fetching wishlist:', e);
    } finally {
      this.setLoading(false);
    }
  };

  /* ---------- listings ---------- */
  fetchListings = async () => {
    this.loading = true;
    this.error = null;
    try {
      const r = await getRequest(`${import.meta.env.VITE_API_URL}/api/users/my-listings`);
      this.listings = r.listings;
    } catch (e: any) {
      this.error = e.message;
      console.error('Error fetching listings:', e);
    } finally {
      this.loading = false;
    }
  };

  createListing = async (payload: {
    title: string;
    brand: string;
    stock: number;
    price: number;
  }): Promise<boolean> => {
    this.setLoading(true);
    this.setError(null);
    try {
      /* 如果后端 image 已非必填，可删掉 image 这一行 */
      const body = { ...payload, image: 'https://via.placeholder.com/300' };
      await postRequest(`${import.meta.env.VITE_API_URL}/api/products`, body);
      await this.fetchListings(); // 刷新
      return true;
    } catch (e: any) {
      this.setError(e.message || 'Failed to create listing');
      console.error('Error creating listing:', e);
      return false;
    } finally {
      this.setLoading(false);
    }
  };

  deleteListing = async (id: string) => {
    this.setLoading(true);
    this.setError(null);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      this.listings = this.listings.filter((l) => l._id !== id);
      return true;
    } catch (e: any) {
      this.setError(e.message || 'Failed to delete listing');
      console.error('Error deleting listing:', e);
      return false;
    } finally {
      this.setLoading(false);
    }
  };

  toggleListing = async (id: string) => {
    this.loading = true;
    this.error = null;
    try {
      await postRequest(`${import.meta.env.VITE_API_URL}/api/products/${id}/toggle`, {});
      this.listings = this.listings.map((l) =>
        l._id === id ? { ...l, disabled: !l.disabled } : l
      );
      return true;
    } catch (e: any) {
      this.error = e.message;
      console.error('Error toggling listing:', e);
      return false;
    } finally {
      this.loading = false;
    }
  };

  /* ---------- comments ---------- */
  fetchComments = async () => {
    this.loading = true;
    this.error = null;
    try {
      const r = await getRequest(`${import.meta.env.VITE_API_URL}/api/users/my-comments`);
      this.comments = r.comments;
    } catch (e: any) {
      this.error = e.message;
      console.error('Error fetching comments:', e);
    } finally {
      this.loading = false;
    }
  };

  toggleComment = async (id: string) => {
    this.loading = true;
    this.error = null;
    try {
      await postRequest(`${import.meta.env.VITE_API_URL}/api/comments/${id}/toggle`, {});
      this.comments = this.comments.map((c) =>
        c._id === id ? { ...c, hidden: !c.hidden } : c
      );
      return true;
    } catch (e: any) {
      this.error = e.message;
      console.error('Error toggling comment:', e);
      return false;
    } finally {
      this.loading = false;
    }
  };
}

/* ---------- export single instance & hook ---------- */
export const profileStore = new ProfileStore();

const ProfileStoreContext = createContext(profileStore);
export const useProfileStore = () => useContext(ProfileStoreContext);