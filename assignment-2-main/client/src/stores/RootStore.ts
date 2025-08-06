import { createContext } from "react"
import { HomeStore } from "./HomeStore"
import { CartStore } from "./CartStore"
import { AdminStore } from "./AdminStore"
import { ProfileStore } from "./ProfileStore"
import { AuthStore } from "./AuthStore"
import { PhoneStore } from "./PhoneStore"
import { SearchStore } from "./SearchStore.ts"

export class RootStore {
  homeStore: HomeStore
  cartStore: CartStore
  adminStore: AdminStore
  ProfileStore: ProfileStore
  authStore: AuthStore
  phoneStore: PhoneStore
  searchStore: SearchStore

  constructor() {
    this.homeStore = new HomeStore(this)
    this.cartStore = new CartStore()
    this.adminStore = new AdminStore(this)
    this.ProfileStore = new ProfileStore()
    this.authStore = new AuthStore()
    this.phoneStore = new PhoneStore(this)
    this.searchStore = new SearchStore(this)
  }
}

export const rootStore = new RootStore()

export const RootStoreContext = createContext(rootStore)
