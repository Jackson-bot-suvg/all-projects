// client/src/stores/CartStore.ts
import { makeAutoObservable, runInAction } from 'mobx'
import { postRequest } from '../utils/requests';
const API_URL = import.meta.env.VITE_API_URL;
/**
 * Represents a single item in the shopping cart.
 */
export type CartItem = {
    /** Unique product identifier */
    phoneId: string
    title: string
    price: number
    quantity: number
    stock: number
}

/**
 * MobX store to manage the shopping cart.
 */
export class CartStore {
    cart: CartItem[] = [];
    constructor() {
        // Automatically make all properties and methods observable
        makeAutoObservable(this)
        // this.fetchCart().catch(console.error)
    }

    setCart(items: CartItem[]): void {
        runInAction(() => {
            this.cart.splice(0, this.cart.length, ...items);
        });
    }


    fetchCart = async () => {
        try {
            const resp = await fetch(`${API_URL}/api/users/cart`, { credentials: 'include' });
            if (!resp.ok) throw new Error('Failed to load cart');
            const data: CartItem[] = await resp.json();

            runInAction(() => {
                this.setCart(data);
            })
        } catch (err) {
            console.error(err);
        }

    }
    
    /**
     * Update the quantity of a specific cart item.
     * @param phoneId - ID of the product to update
     * @param quantity - New quantity (must be a number)
     */
    updateQuantity = async (phoneId: string, quantity: number) => {
        await fetch(`${API_URL}/api/users/cart/update`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneId, quantity })
        });
        await this.fetchCart();
    }

    /**
     * Remove a single item from the cart.
     * @param phoneId - ID of the product to remove
     */
    removeItem = async (phoneId: string) => {
        await fetch(`${API_URL}/api/users/cart/remove`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneId })
        });
        await this.fetchCart();
    }

    /**
     * Clear all items from the cart.
     */
    clearCart = async () => {
        await fetch(`${API_URL}/api/users/cart/clear`, {
            method: 'POST',
            credentials: 'include'
        });
        await this.fetchCart();
    }

    makeOrder = async () => {
        try {
            const requestBody = {
                items: [],
                totalPrice: 0
            };

            this.cart.forEach(item => {
                requestBody.totalPrice += item.quantity * item.price;
                requestBody.items.push({
                    _id: item.phoneId,
                    name: item.title,
                    quantity: item.quantity
                })
            })

            await postRequest(`${API_URL}/api/transaction/`, requestBody);
            this.clearCart();
                
        } catch (err) {
            if (err instanceof Error) {
                console.error(err.message);
            }
        }
    }
}


