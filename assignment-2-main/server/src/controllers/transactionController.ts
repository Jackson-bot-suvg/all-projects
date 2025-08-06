import { Request, Response, NextFunction } from "express";
import Transaction from "../models/transactionModel";
import User from "../models/userModel";
import { CustomRequest } from '../types/CustomRequest';
import ProductListing from "../models/productListingModel";

export const getAllTransactions = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const { 
            sortField = 'createdAt',
            sortOrder = 'desc',
            buyer,
        } = req.query;
        
        const sorter: any = {}
        if (String(sortField) !== "undefined") {
            switch (sortOrder) {
                case 'asc':
                    sorter[String(sortField)] = 1;
                    break;
                case 'desc':
                    sorter[String(sortField)] = -1;
                    break;
                default:
                    sorter[String(sortField)] = undefined;

            }
        }

        const filter: any = {};
        if (buyer) {
            filter["buyer"] = buyer;
        }

        const transactions = await Transaction.find(filter)
            .populate("buyer", "firstname lastname")
            .sort(sorter);
        
        res.status(200).json(transactions);

    } catch (err) {
        next(err);
    }
}

export const getRecentTransactions = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const startTime = req.query.startTime || Date.now() - 60000;

        const transactions = await Transaction.find({
            createdAt: {$gt: new Date(Number(startTime))}
        })
        .populate('buyer', 'firstname lastname')
        .sort({createdAt: -1})
        .limit(10);
        
        res.status(200).json(transactions);
    } catch (err) {
        next(err);
    }
}

export const createTransaction = async(req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            res.status(400).json({message: "User not found"});
        } else {
            
            //Not best practice for transaction handling because we should be making transactions atomic.
            //For best practice, use mongoose.startSession() for transaction session
            const transaction = new Transaction({buyer: req.user.userId, ...req.body});
            const savedTransaction = await transaction.save();

            const items = req.body.items;
            if (Array.isArray(items)) {
                for (const item of items) {
                    const productListing = await ProductListing.findById(item._id);
                    if (productListing) {
                        productListing.stock = Math.max(productListing.stock - item.quantity, 0);
                        await productListing.save();
                    }
                }
            }

            res.status(200).json(savedTransaction);
        }
    } catch (err) {
        next(err);
    }
}

interface BuyerDocument {
    firstname: string;
    lastname: string;
    _id: string;
}

export const exportCSV = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transactions = await Transaction.find()
            .populate("buyer", "firstname lastname")
            .sort({createdAt: -1});

        let csv = "Transaction ID,Timestamp,Buyer,Item Name,Quantity,Transaction Total\n";

        transactions.forEach(transaction => {
            let currentTransaction = "";
            const transactionDate = new Date(transaction.createdAt).toLocaleString("en-AU", {timeZone: "Australia/Sydney"});
            const buyerName = `${(transaction.buyer as unknown as BuyerDocument).firstname} ${(transaction.buyer as unknown as BuyerDocument).lastname}`

            transaction.items.forEach(item => {
                const itemName = `"${item.name.replace(/"/g, '""')}"`;
                currentTransaction += `${transaction._id},"${transactionDate}",${buyerName},${itemName}'},${item.quantity},${transaction.totalPrice}\n`;
            })
            csv += currentTransaction;
        })

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
        res.status(200).send(csv);
    } catch (err) {
        next(err);
    }
}