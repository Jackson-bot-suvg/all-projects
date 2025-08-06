// src/stores/HomeStore.ts
import { makeAutoObservable } from "mobx";
import { RootStore } from "./RootStore";

/* ------------- Type Declarations ------------- */
export interface PhoneDetail {
  _id:     string;
  title:   string;
  brand:   string;
  image:   string;
  stock:   number;
  seller:  { _id: string; firstName: string; lastName: string };
  price:   number;
  reviews: {
    _id: string;
    reviewer: string;
    rating: number;
    comment: string;
    hidden?: boolean;
  }[];
}

export interface PhoneReview {
  _id: string;
  reviewer: string;
  rating: number;
  comment: string;
  hidden?: boolean;
}

export type PhoneListing = {
  _id:    string;
  title:  string;
  brand:  string;
  image:  string;
  stock:  number;
  seller: string;
  price:  number;
  reviews:
    | {
        reviewer: string;
        rating:   number;
        comment:  string;
        hidden:   string;
      }
    | {
        reviewer: string;
        rating:   number;
        comment:  string;
        hidden?:  undefined;
      }[];
};

/* ------------- Store ------------- */
export class HomeStore {
  rootStore: RootStore;

  /** Top-rated products (best sellers, max 5) */
  bestSellers:  PhoneListing[] = [];

  /** Phones that are about to sell out (stock > 0, not disabled, lowest stock, max 5) */
  soldOutSoon:  PhoneListing[] = [];          // ← new field

  /** Brand filter used in the search page */
  brandFilter:  string = "Apple";

  /** API base URL, read from environment variables */
  private readonly API_URL: string;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.API_URL   = import.meta.env.VITE_API_URL || "http://localhost:3000";
    makeAutoObservable(this);
  }

  /* ------------ Mutators ------------ */
  setBestSellers = (phones: PhoneListing[]) => {
    this.bestSellers = phones;
  };

  setSoldOutSoon = (phones: PhoneListing[]) => {      // ← new setter
    this.soldOutSoon = phones;
  };

  /* ------------ UI helpers ------------ */
  changeFilter = (brand: string) => {
    this.brandFilter = brand;
  };
}

/* Export a singleton store (adapt if you use dependency injection) */
const homeStore = new HomeStore({} as RootStore);
export default homeStore;
export { homeStore };