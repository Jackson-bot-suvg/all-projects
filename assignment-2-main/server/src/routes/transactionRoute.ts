import { Router } from "express";
import { getAllTransactions, createTransaction, exportCSV, getRecentTransactions } from "../controllers/transactionController";
import { requireAdmin, verifyToken } from '../middleware/authMiddleware';

const router = Router();

router.post("/", verifyToken, createTransaction);

router.get("/", getAllTransactions);

router.get("/recent", getRecentTransactions);

router.get("/export/csv", exportCSV);

export default router;