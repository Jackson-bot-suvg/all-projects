import { makeAutoObservable, runInAction } from "mobx"
import type { RootStore } from "./RootStore"
import type { PhoneListing } from "./HomeStore"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

export class SearchStore {
  rootStore: RootStore
  searchQuery = ""
  searchResults: PhoneListing[] = []
  loading = false
  error: string | null = null

  brandFilter = ""
  priceRange: [number, number] = [0, 2000]

  availableBrands: string[] = []
  priceRangeLimits: [number, number] = [0, 2000]

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    makeAutoObservable(this)
    this.fetchBrands()
    this.fetchPriceRange()
  }

  setSearchQuery = (query: string) => {
    this.searchQuery = query
  }

  setBrandFilter = (brand: string) => {
    this.brandFilter = brand
  }

  setPriceRange = (range: [number, number]) => {
    this.priceRange = range
  }

  resetFilters = () => {
    this.brandFilter = ""
    this.priceRange = [...this.priceRangeLimits]
  }

  async fetchBrands() {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/products/brands`,
        { credentials: "include" }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const brands: string[] = await res.json()
      runInAction(() => {
        this.availableBrands = brands
      })
    } catch (e) {
      console.error("fetchBrands error:", e)
    }
  }

  async fetchPriceRange() {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/products/price-range`,
        { credentials: "include" }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { min, max } = await res.json()
      runInAction(() => {
        this.priceRangeLimits = [min, max]
        this.priceRange = [min, max]
      })
    } catch (e) {
      console.error("fetchPriceRange error:", e)
    }
  }

  search = async () => {
    this.loading = true
    this.error = null

    const params = new URLSearchParams()
    if (this.searchQuery) params.append("query", this.searchQuery)
    if (this.brandFilter) params.append("brand", this.brandFilter)
    if (this.priceRange[0] > this.priceRangeLimits[0])
      params.append("minPrice", this.priceRange[0].toString())
    if (this.priceRange[1] < this.priceRangeLimits[1])
      params.append("maxPrice", this.priceRange[1].toString())

    const url = `${API_BASE_URL}/api/products/search?${params.toString()}`
    console.log("search fetch url:", url)

    try {
      const res = await fetch(url, { credentials: "include" })
      console.log("search fetch status:", res.status)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: PhoneListing[] = await res.json()
      runInAction(() => {
        this.searchResults = data
        this.loading = false
      })
    } catch (e: any) {
      runInAction(() => {
        this.error = e.message || "Unknown error"
        this.loading = false
      })
      console.error("search error:", e)
    }
  }
}