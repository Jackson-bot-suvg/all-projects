import express from "express";
import cors from "cors";
import connectDB from "./config/db";
import initializeDB from "./scripts/initializeDB";
import productRoute from "./routes/productsRoute";
import authRoutes from './routes/authRoute';
import userRoutes from './routes/userRoute';
import adminRoutes from './routes/adminRoute';
import transactionRoutes from './routes/transactionRoute';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { sessionConfig } from './config/session';

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,  
  allowedHeaders: ['Content-Type','Authorization']
}

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(session(sessionConfig));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoute);
app.use('/api/admin', adminRoutes);
app.use('/api/transaction', transactionRoutes);

// Connect to database and initialize
(async () => {
  try {
    await connectDB();
    await initializeDB();
  } catch (err) {
    console.error('Failed to initialize application:', err);
    process.exit(1);
  }
})();

app.get('/', (req:any, res: any) => {
  res.json({message: "Hello, World!"});
})

export default app;