// src/stores/AdminStore.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from './RootStore';
import { getRequest, putRequest } from '../utils/requests';

export type UserRecord = {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    createdAt: string;
    lastLogin?: string;
    verified: boolean;
    disabled: boolean;
};

export type ActivityLogRecord = {
    _id: string;
    adminId: {
        _id: string;
        firstname: string;
        lastname: string;
        email: string;
    };
    action: string;
    targetType: string;
    targetId: string;
    details: {
        before: any;
        after: any;
    };
    timestamp: string;
    status: string;
};

export type ListingRecord = {
    _id: string;
    title: string;
    brand: string;
    price: number;
    stock: number;
    disabled: boolean;
};

export type ReviewRecord = {
    _id: string;
    reviewer: { firstname: string; lastname: string; email: string };
    listingId: string;
    listingTitle: string;
    brand: string;
    rating: number;
    comment: string;
    hidden: boolean;
    createdAt: string;
};

export type OrderRecord = {
    _id: string;
    timestamp: string;
    buyer: {_id: string, firstname: string, lastname: string};
    items: Array<{ name: string; quantity: number }>;
    totalPrice: number;
};

export type TransactionFilters = {
    sortField?: string;
    sortOrder?: 'asc' | 'desc' | undefined;
    buyer?: string;
}

export class AdminStore {
    rootStore: RootStore;
    users: UserRecord[] = [];
    filteredUsers: UserRecord[] = [];
    searchTerm: string = '';
    currentPage: number = 1;
    userSortField: string = 'createdAt';
    userSortOrder: 'asc' | 'desc' = 'desc';
    userVerifiedFilter: string | null = null;
    userDisabledFilter: string | null = null;
    listings: ListingRecord[] = [];
    filteredListings: ListingRecord[] = [];
    listingSearchTerm: string = '';
    listingCurrentPage: number = 1;
    listingSortField: string = 'createdAt';
    listingSortOrder: 'asc' | 'desc' = 'desc';
    listingBrandFilter: string | null = null;
    listingDisabledFilter: string | null = null;
    listingUserIdFilter?: string; 
    reviews: ReviewRecord[] = [];
    transactions: OrderRecord[] = [];
    transactionFilters: TransactionFilters = {
        sortField: 'createdAt',
        sortOrder: 'desc',
    };
    buyerFilter: string[] = [];
    transactionPage: number = 1;
    activityLogs: ActivityLogRecord[] = [];
    loading: boolean = false;
    error: string | null = null;
    reviewLoading: boolean = false;
    reviewError: string | null = null;
    maxListingPrice = 0;

    constructor(rootStore: RootStore) {
        makeAutoObservable(this);
        this.rootStore = rootStore;
    }

    setLoading = (loading: boolean) => {
        this.loading = loading;
    };

    setError = (error: string | null) => {
        this.error = error;
    };

    setUsers = (users: UserRecord[]) => {
        this.users = users;
        this.filterUsers();
    };

    setSearchTerm = (term: string) => {
        this.searchTerm = term;
        this.currentPage = 1;
        this.filterUsers();
    };

    setCurrentPage = (page: number) => {
        this.currentPage = page;
    };

    setUserSort = (field: string, order: 'asc' | 'desc') => {
        this.userSortField = field;
        this.userSortOrder = order;
    };

    setUserVerifiedFilter = (value: string | null) => {
        this.userVerifiedFilter = value;
        this.currentPage = 1;
    };

    setUserDisabledFilter = (value: string | null) => {
        this.userDisabledFilter = value;
        this.currentPage = 1;
    };

    filterUsers = () => {
        if (!this.searchTerm.trim()) {
            this.filteredUsers = this.users;
            return;
        }

        const searchLower = this.searchTerm.trim().toLowerCase();
        this.filteredUsers = this.users.filter(user => 
            user.email.toLowerCase().includes(searchLower) ||
            `${user.firstname} ${user.lastname}`.toLowerCase().includes(searchLower)
        );
    };

    setListings = (listings: ListingRecord[]) => {
        this.listings = listings;
        this.maxListingPrice = listings.length
            ? Math.max(...listings.map(l => l.price))
            : 0;
        this.filterListings();
    };

    setListingSearchTerm = (term: string) => {
        this.listingSearchTerm = term;
        this.listingCurrentPage = 1;
        this.filterListings();
    };

    setListingCurrentPage = (page: number) => {
        this.listingCurrentPage = page;
    };

    filterListings = () => {
        if (!this.listingSearchTerm.trim()) {
            this.filteredListings = this.listings;
            this.listingCurrentPage = 1;
            return;
        }

        const searchLower = this.listingSearchTerm.trim().toLowerCase();
        this.filteredListings = this.listings.filter(listing => 
            listing.title.toLowerCase().includes(searchLower) ||
            listing.brand.toLowerCase().includes(searchLower)
        );
        this.listingCurrentPage = 1;
    };

    setReviews = (reviews: ReviewRecord[]) => {
        this.reviews = reviews;
    };

    getReviews = async (params?: {
        brand?: string;
        status?: string;
        search?: string;
        sortField?: string;
        sortOrder?: 'asc' | 'desc';
        userId?: string;
    }) => {
        this.reviewLoading = true;
        this.reviewError = null;
        try {
            const queryParams = new URLSearchParams();
            if (params) {
                Object.entries(params).forEach(([k, v]) => {
                    if (v !== undefined && v !== null && v !== '') queryParams.append(k, String(v));
                });
            }
            const url = `${import.meta.env.VITE_API_URL}/api/admin/reviews${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await getRequest(url);
            runInAction(() => {
                this.setReviews(response);
            });
        } catch (err: any) {
            if (err.message && err.message.includes('404')) {
                runInAction(() => {
                    this.setReviews([]);
                    this.reviewError = null;
                });
            } else {
                runInAction(() => {
                    this.reviewError = err.message || 'Failed to fetch reviews';
                });
            }
        } finally {
            runInAction(() => {
                this.reviewLoading = false;
            });
        }
    };

    updateReviewVisibility = async (listingId: string, reviewId: string, hidden: boolean) => {
        try {
            await putRequest(
                `${import.meta.env.VITE_API_URL}/api/admin/reviews/${listingId}/${reviewId}`,
                { hidden }
            );
            runInAction(() => {
                this.reviews = this.reviews.map(r =>
                    r.listingId === listingId && r._id === reviewId
                        ? { ...r, hidden }
                        : r
                );
            });
        } catch (err: any) {
            this.reviewError = err.message || 'Failed to update review';
        }
    };

    getUsers = async (params?: {
        sortField?: string;
        sortOrder?: 'asc' | 'desc';
        verified?: string | null;
        disabled?: string | null;
    }) => {
        this.setLoading(true);
        this.setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (params?.sortField) {
                queryParams.append('sortField', params.sortField);
            }
            if (params?.sortOrder) {
                queryParams.append('sortOrder', params.sortOrder);
            }
            if (params?.verified !== null && params?.verified !== undefined) {
                queryParams.append('verified', params.verified);
            }
            if (params?.disabled !== null && params?.disabled !== undefined) {
                queryParams.append('disabled', params.disabled);
            }

            const url = `${import.meta.env.VITE_API_URL}/api/admin/users${
                queryParams.toString() ? `?${queryParams.toString()}` : ''
            }`;

            const response = await getRequest(url);
            runInAction(() => {
                if (response && Array.isArray(response)) {
                    this.setUsers(response.map((user: any) => ({
                        _id: user._id,
                        firstname: user.firstname,
                        lastname: user.lastname,
                        email: user.email,
                        createdAt: user.registrationDate || user.createdAt,
                        lastLogin: user.lastLogin,
                        verified: user.verified,
                        disabled: user.disabled
                    })));
                } else {
                    throw new Error('Invalid response format');
                }
            });
        } catch (err: any) {
            runInAction(() => {
                this.setError(err.message || 'Failed to fetch users');
            });
            console.error('Error fetching users:', err);
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    };

    get uniqueBrands(): string[] {
        const brands = new Set(this.listings.map(listing => listing.brand));
        return Array.from(brands).sort();
    }

    setListingSort = (field: string, order: 'asc' | 'desc') => {
        this.listingSortField = field;
        this.listingSortOrder = order;
    };

    setListingBrandFilter = (value: string | null) => {
        this.listingBrandFilter = value;
        this.listingCurrentPage = 1;
        this.getListings({
            sortField: this.listingSortField,
            sortOrder: this.listingSortOrder,
            brand: value,
            disabled: this.listingDisabledFilter,
            userId: this.listingUserIdFilter
        });
    };

    setListingDisabledFilter = (value: string | null) => {
        this.listingDisabledFilter = value;
        this.listingCurrentPage = 1;
        this.getListings({
            sortField: this.listingSortField,
            sortOrder: this.listingSortOrder,
            brand: this.listingBrandFilter,
            disabled: value,
            userId: this.listingUserIdFilter
        });
    };

    getListings = async (params?: {
        userId?: string; 
        sortField?: string;
        sortOrder?: 'asc' | 'desc';
        brand?: string | null;
        disabled?: string | null;
        minPrice?: number;
        maxPrice?: number;
    }) => {
        this.setLoading(true);
        this.setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (params?.sortField) {
                queryParams.append('sortField', params.sortField);
            }
            if (params?.sortOrder) {
                queryParams.append('sortOrder', params.sortOrder);
            }
            if (params?.brand) {
                queryParams.append('brand', params.brand);
            }
            if (params?.disabled !== null && params?.disabled !== undefined) {
                queryParams.append('disabled', params.disabled);
            }
            if (params?.userId) {
                queryParams.append('userId', params.userId);
                }
            if (params?.minPrice !== undefined) {
                queryParams.append('minPrice', params.minPrice.toString());
            }
            if (params?.maxPrice !== undefined) {
                queryParams.append('maxPrice', params.maxPrice.toString());
            }

            const url = `${import.meta.env.VITE_API_URL}/api/admin/listings${
                queryParams.toString() ? `?${queryParams.toString()}` : ''
            }`;

            const response = await getRequest(url);
            runInAction(() => {
                if (response && Array.isArray(response)) {
                    this.setListings(response.map((listing: any) => ({
                        _id: listing._id,
                        title: listing.title,
                        brand: listing.brand,
                        price: listing.price,
                        stock: listing.stock,
                        disabled: listing.disabled || false
                    })));
                } else {
                    throw new Error('Invalid response format');
                }
            });
        } catch (err: any) {
            runInAction(() => {
                this.setError(err.message || 'Failed to fetch listings');
            });
            console.error('Error fetching listings:', err);
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    };

    // getReviews = async () => {
    //     this.setLoading(true);
    //     this.setError(null);
    //     try {
    //         const response = await getRequest(`${import.meta.env.VITE_API_URL}/api/admin/reviews`);
    //         runInAction(() => {
    //             if (response && Array.isArray(response)) {
    //                 const reviews: ReviewRecord[] = [];
    //                 response.forEach((listing: any) => {
    //                     if (listing.reviews) {
    //                         listing.reviews.forEach((review: any) => {
    //                             reviews.push({
    //                                 _id: review._id,
    //                                 reviewerName: review.userName || 'Anonymous',
    //                                 listingTitle: listing.title,
    //                                 rating: review.rating,
    //                                 comment: review.comment,
    //                                 hidden: review.hidden || false
    //                             });
    //                         });
    //                     }
    //                 });
    //                 this.setReviews(reviews);
    //             } else {
    //                 throw new Error('Invalid response format');
    //             }
    //         });
    //     } catch (err: any) {
    //         runInAction(() => {
    //             this.setError(err.message || 'Failed to fetch reviews');
    //         });
    //         console.error('Error fetching reviews:', err);
    //     } finally {
    //         runInAction(() => {
    //             this.setLoading(false);
    //         });
    //     }
    // };

    updateUser = async (userId: string, userData: Partial<UserRecord>) => {
        this.setLoading(true);
        this.setError(null);
        try {
            const response = await putRequest(
                `${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`,
                userData
            );
            
            // Update the user in the local state
            runInAction(() => {
                this.users = this.users.map(user => 
                    user._id === userId 
                        ? { ...user, ...userData }
                        : user
                );
                // Re-filter users to update the view
                this.filterUsers();
            });
            
            if (response.emailChanged) {
                return {
                    success: true,
                    message: 'User updated. Verification email sent to new address.'
                };
            }
            
            return { success: true, message: 'User updated successfully' };
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to update user';
            this.setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    };

    updateListing = async (listingId: string, listingData: Partial<ListingRecord>) => {
        this.setLoading(true);
        this.setError(null);
        try {
            const response = await putRequest(
                `${import.meta.env.VITE_API_URL}/api/admin/listings/${listingId}`,
                listingData
            );
            
            // Update the listing in the local state
            runInAction(() => {
                this.listings = this.listings.map(listing => 
                    listing._id === listingId 
                        ? { ...listing, ...listingData }
                        : listing
                );
                // Re-filter listings to update the view
                this.filterListings();
            });
            
            return { success: true, message: 'Listing updated successfully' };
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to update listing';
            this.setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    };

    getActivityLogs = async (filters?: {
        targetType?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        this.setLoading(true);
        this.setError(null);
        try {
            let url = `${import.meta.env.VITE_API_URL}/api/admin/logs`;
            const params = new URLSearchParams();
            
            if (filters?.targetType) {
                params.append('targetType', filters.targetType);
            }
            if (filters?.startDate) {
                params.append('startDate', filters.startDate);
            }
            if (filters?.endDate) {
                params.append('endDate', filters.endDate);
            }

            const queryString = params.toString();
            if (queryString) {
                url += `?${queryString}`;
            }

            const response = await getRequest(url);
            runInAction(() => {
                if (response && Array.isArray(response)) {
                    this.activityLogs = response;
                } else {
                    throw new Error('Invalid response format');
                }
            });
        } catch (err: any) {
            runInAction(() => {
                this.setError(err.message || 'Failed to fetch activity logs');
            });
            console.error('Error fetching activity logs:', err);
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    };

    getTransactions = async () => {
        this.loading = true;
        let url = `${import.meta.env.VITE_API_URL}/api/transaction/`;
        const params = new URLSearchParams();
        
        for (const filter of Object.keys(this.transactionFilters)) {
            params.append(filter, this.transactionFilters[filter]);
        }
        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        console.log(url);

        try {
            const response = await getRequest(url);

            runInAction(() => {
                if (response && Array.isArray(response)) {
                    this.transactions = response;
                    this.loading = false;
                } else {
                    throw new Error('Invalid response format');
                }
            });
        } catch (err) {
            console.error(err);
        }
    }

    setTransactionSort = (sortField: string, sortOrder: 'asc' | 'desc') => {
        this.transactionFilters = {
            ...this.transactionFilters,
            sortField: sortField,
            sortOrder: sortOrder
        }
    }

    setTransactionPage = (page: number) => {
        this.transactionPage = page;
    }

    exportTransactionCSV = async () => {
        const url = `${import.meta.env.VITE_API_URL}/api/transaction/export/csv`;
        try {
            const response = await fetch(url, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "text/csv",
                }
            });
            const blob = await response.blob();
            const downloadURL = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadURL;
            link.download = 'transactions.csv';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadURL);
        } catch (err) {
            console.error(err);
        }
    }

    // setBuyerFilter = (newBuyerFilter: string[]) => {
    //     this.buyerFilter = newBuyerFilter;
    // }
}