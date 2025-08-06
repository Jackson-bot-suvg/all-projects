import { Router } from "express";
import { getBestSellers, getSoldOutSoon,getById, addReview, searchProducts, getBrands, getPriceRange,createListing, toggleListing, deleteListing } from "../controllers/productsController";
import { verifyToken }  from '../middleware/authMiddleware';


const router = Router()

router.post('/', verifyToken, createListing);           // POST /api/listings
router.post('/:id/toggle', verifyToken, toggleListing); // POST /api/listings/:id/toggle
router.delete('/:id', verifyToken, deleteListing);      // DELETE /api/listings/:id
// Get best sellers
router.get("/best-sellers", getBestSellers)
// Get sold out soon
router.get("/sold-out-soon", getSoldOutSoon)

// Search products with optional filters
router.get("/search", searchProducts)

router.post('/:id/reviews', verifyToken, addReview);

// Get all unique brands
router.get("/brands", getBrands)

// Get min and max price range
router.get("/price-range", getPriceRange)

// Get product by ID
router.get("/:id", getById)


export default router

