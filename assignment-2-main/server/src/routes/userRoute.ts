import {
    updateProfile,
    verifyPassword,
    changePassword,
    getUserInfo,
    requestEmailChange,
    confirmEmailChange,
    validateEmailChangeToken,
    getCart,
    addToCart,
    addToWishlist,
    getWishlist,
    updateCartItem,
    removeFromCart,
    clearCart,
    getMyListings,
    getMyWrittenReviews,
    toggleCommentVisibility
} from '../controllers/userController';

import { verifyToken } from '../middleware/authMiddleware';
import { Router } from "express";


const router = Router();


router.get('/me', verifyToken, getUserInfo);
router.post('/update-profile', verifyToken, updateProfile);
router.post('/verify-password', verifyToken, verifyPassword);
router.post('/change-password', verifyToken, changePassword);
router.post('/request-email-change', verifyToken, requestEmailChange);
router.post('/validate-email-token/:token', validateEmailChangeToken);
router.post('/confirm-email-change/:token', confirmEmailChange);
router.get('/cart', verifyToken, getCart);
router.post('/cart/add', verifyToken, addToCart);
router.post('/cart/update', verifyToken, updateCartItem);
router.post('/cart/remove', verifyToken, removeFromCart);
router.post('/cart/clear', verifyToken, clearCart);
router.post('/wishlist/add', verifyToken, addToWishlist);
router.get('/wishlist', verifyToken, getWishlist);
router.get('/my-listings', verifyToken, getMyListings);
router.get('/my-written-reviews', verifyToken, getMyWrittenReviews);
router.put('/listings/:listingId/reviews/:reviewId/toggle-visibility', verifyToken, toggleCommentVisibility);




export default router; 