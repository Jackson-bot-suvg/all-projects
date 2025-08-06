import express, { Router } from 'express';
import { isAdmin } from '../middleware/adminMiddleware';
import {
    getUsers,
    getUserById,
    updateUser,
    disableUser,
    getListings,
    updateListing,
    disableListing,
    getReviews,
    updateReviewVisibility,
    // updateReview,
    // deleteReview,
    // getSalesLogs,
    getActivityLogs,
    searchUsers,
    searchListings
    // toggleCommentVisibility
} from '../controllers/adminController';

const router: Router = express.Router();

// User Management Routes
router.get('/users/search', isAdmin, searchUsers);
router.get('/users', isAdmin, getUsers);
router.get('/users/:userId', isAdmin, getUserById);
router.put('/users/:userId', isAdmin, updateUser);
router.put('/users/:userId/disable', isAdmin, disableUser);

// Listing Management Routes
router.get('/listings/search', isAdmin, searchListings);
router.get('/listings', isAdmin, getListings);
router.put('/listings/:listingId', isAdmin, updateListing);
router.put('/listings/:listingId/disable', isAdmin, disableListing);

//
// Review Management Routes
// router.get('/reviews', isAdmin, getReviews);
// router.put('/reviews/:listingId/:reviewId', isAdmin, updateReview);
// router.delete('/reviews/:listingId/:reviewId', isAdmin, deleteReview);
// router.get('/reviews', isAdmin, getMyListingReviews);
// router.put('/reviews/:listingId/:reviewId', isAdmin, toggleCommentVisibility);
router.get('/reviews', isAdmin, getReviews);
router.put('/reviews/:listingId/:reviewId', isAdmin, updateReviewVisibility);
// // Logs Routes
// router.get('/logs/sales', isAdmin, getSalesLogs);
router.get('/logs', isAdmin, getActivityLogs);

export default router; 