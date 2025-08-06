import { Request, Response, NextFunction, RequestHandler } from 'express';
import { CustomRequest } from '../types/CustomRequest';
import User from '../models/userModel';
import ProductListing from '../models/productListingModel';
import { emailService } from '../services/emailService';
import { loggingService } from '../services/loggingService';
import VerificationToken from '../models/verificationToken';
import crypto from 'crypto';
import mongoose from 'mongoose';

// User Management
export const getUsers: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { 
            sortField = 'createdAt',
            sortOrder = 'desc',
            verified,
            disabled
        } = req.query;

        // Build filter object
        const filter: any = {};
        if (verified !== undefined) {
            filter.verified = verified === 'true';
        }
        if (disabled !== undefined) {
            filter.disabled = disabled === 'true';
        }

        const users = await User.find(filter)
            .select('-password')
            .sort({ [sortField as string]: sortOrder === 'desc' ? -1 : 1 });

        res.json(users);
    } catch (err) {
        next(err);
    }
};

export const getUserById: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    } catch (err) {
        next(err);
    }
};

export const updateUser: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user || !user._id) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const { firstname, lastname, email, disabled } = req.body;
        let emailChanged = false;

        // Store the original user state for logging
        const originalUser = {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            disabled: user.disabled,
            verified: user.verified
        };

        // Update basic info
        if (firstname) user.firstname = firstname;
        if (lastname) user.lastname = lastname;
        if (typeof disabled === 'boolean') user.disabled = disabled;

        // Handle email change
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                res.status(400).json({ message: 'Email already in use' });
                return;
            }

            // Generate verification token
            const token = crypto.randomBytes(32).toString('hex');
            await VerificationToken.create({
                userId: user._id,
                token,
                email,
                type: 'email'
            });

            // Send verification email to new address
            await emailService.sendVerificationEmail(email, token);

            // Send notification to old email
            await emailService.sendEmailChangeNotification(user.email);

            // Update email but mark as unverified
            user.email = email;
            user.verified = false;
            emailChanged = true;
        }

        await user.save();

        // Log the activity
        if (req.session?.userId) {
            await loggingService.logActivity({
                adminId: new mongoose.Types.ObjectId(req.session.userId),
                action: 'UPDATE',
                targetType: 'USER',
                targetId: user._id as mongoose.Types.ObjectId,
                details: {
                    before: originalUser,
                    after: {
                        firstname: user.firstname,
                        lastname: user.lastname,
                        email: user.email,
                        disabled: user.disabled,
                        verified: user.verified
                    }
                }
            });
        }

        res.json({
            message: 'User updated successfully',
            emailChanged,
            user: {
                _id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                verified: user.verified,
                disabled: user.disabled,
                createdAt: user.registrationDate,
                lastLogin: user.lastLogin
            }
        });
    } catch (err) {
        next(err);
    }
};

export const disableUser: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user || !user._id) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (user.isAdmin) {
            res.status(403).json({ message: 'Cannot disable admin account' });
            return;
        }

        const originalState = user.disabled;
        user.disabled = !user.disabled;
        await user.save();

        // Log the activity
        if (req.session?.userId) {
            await loggingService.logActivity({
                adminId: new mongoose.Types.ObjectId(req.session.userId),
                action: user.disabled ? 'DISABLE' : 'ENABLE',
                targetType: 'USER',
                targetId: user._id as mongoose.Types.ObjectId,
                details: {
                    before: { disabled: originalState },
                    after: { disabled: user.disabled }
                }
            });
        }

        res.json({ message: `User ${user.disabled ? 'disabled' : 'enabled'} successfully`, user });
    } catch (err) {
        next(err);
    }
};

// Listing Management
export const getListings: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {
            userId,
            sortField = 'createdAt',
            sortOrder = 'desc',
            brand,
            disabled,
            minPrice,
            maxPrice
        } = req.query;

        // Build filter object
        const filter: any = {};
        if (userId) {
            filter.seller = userId;        // ProductListing.seller 字段在 schema 中是 ObjectId
        }
        if (brand) {
            filter.brand = brand;
        }
        if (disabled !== undefined) {
            filter.disabled = disabled === 'true';
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) {
                filter.price.$gte = Number(minPrice);
            }
            if (maxPrice !== undefined) {
                filter.price.$lte = Number(maxPrice);
            }
        }

        const listings = await ProductListing.find(filter)
            .sort({ [sortField as string]: sortOrder === 'desc' ? -1 : 1 });

        res.json(listings);
    } catch (err) {
        next(err);
    }
};

export const updateListing: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const originalListing = await ProductListing.findById(req.params.listingId);
        if (!originalListing) {
            res.status(404).json({ message: 'Listing not found' });
            return;
        }

        const updatedListing = await ProductListing.findByIdAndUpdate(
            req.params.listingId,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedListing) {
            res.status(404).json({ message: 'Listing not found' });
            return;
        }

        // Log the activity
        if (req.session?.userId) {
            await loggingService.logActivity({
                adminId: new mongoose.Types.ObjectId(req.session.userId),
                action: 'UPDATE',
                targetType: 'LISTING',
                targetId: updatedListing._id,
                details: {
                    before: {
                        title: originalListing.title,
                        brand: originalListing.brand,
                        price: originalListing.price,
                        stock: originalListing.stock,
                        disabled: originalListing.disabled
                    },
                    after: {
                        title: updatedListing.title,
                        brand: updatedListing.brand,
                        price: updatedListing.price,
                        stock: updatedListing.stock,
                        disabled: updatedListing.disabled
                    }
                }
            });
        }

        res.json({ message: 'Listing updated successfully', listing: updatedListing });
    } catch (err) {
        next(err);
    }
};

export const disableListing: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const listing = await ProductListing.findById(req.params.listingId);
        
        if (!listing) {
            res.status(404).json({ message: 'Listing not found' });
            return;
        }

        const originalState = listing.disabled;
        listing.disabled = !listing.disabled;
        await listing.save();

        // Log the activity
        if (req.session?.userId) {
            await loggingService.logActivity({
                adminId: new mongoose.Types.ObjectId(req.session.userId),
                action: listing.disabled ? 'DISABLE' : 'ENABLE',
                targetType: 'LISTING',
                targetId: listing._id,
                details: {
                    before: { disabled: originalState },
                    after: { disabled: listing.disabled }
                }
            });
        }

        res.json({ message: `Listing ${listing.disabled ? 'disabled' : 'enabled'} successfully`, listing });
    } catch (err) {
        next(err);
    }
};

// Review Management
export const getReviews: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      brand,
      status, // 'active' | 'disabled'
      search,
      sortField = 'createdAt',
      sortOrder = 'desc', // 'asc' | 'desc'
      userId
    } = req.query;

    const listingFilter: any = {};
    if (brand) listingFilter.brand = brand;
    if (status === 'active') listingFilter.disabled = false;
    if (status === 'disabled') listingFilter.disabled = true;

    const listings = await ProductListing.find(listingFilter)
      .populate('reviews.reviewer', 'firstname lastname email')
      .lean();

    let reviews: any[] = [];
    listings.forEach((listing: any) => {
      listing.reviews.forEach((review: any) => {
        if (userId && String(review.reviewer?._id) !== String(userId)) return;
        reviews.push({
          _id: review._id,
          reviewer: review.reviewer,
          listingId: listing._id,
          listingTitle: listing.title,
          brand: listing.brand,
          rating: review.rating,
          comment: review.comment,
          hidden: review.hidden,
          createdAt: review.createdAt
        });
      });
    });

    if (search) {
      const s = String(search).toLowerCase();
      reviews = reviews.filter(r =>
        (r.reviewer?.firstname?.toLowerCase().includes(s) ||
         r.reviewer?.lastname?.toLowerCase().includes(s) ||
         r.listingTitle?.toLowerCase().includes(s) ||
         r.comment?.toLowerCase().includes(s))
      );
    }

    // sort
    if (sortField === 'reviewer') {
      reviews.sort((a, b) => {
        const aName = (a.reviewer?.firstname + a.reviewer?.lastname).toLowerCase();
        const bName = (b.reviewer?.firstname + b.reviewer?.lastname).toLowerCase();
        return sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
      });
    } else if (sortField === 'createdAt') {
      reviews.sort((a, b) =>
        sortOrder === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

export const updateReviewVisibility: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { listingId, reviewId } = req.params;
    const { hidden } = req.body;

    const listing = await ProductListing.findById(listingId);
    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }
    const review = listing.reviews.id(reviewId);
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }
    review.hidden = hidden;
    await listing.save();
    res.json({ success: true, hidden: review.hidden });
  } catch (err) {
    next(err);
  }
};

// Search
export const searchUsers: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { query } = req.query;
        const users = await User.find({
            $or: [
                { firstname: { $regex: query, $options: 'i' } },
                { lastname: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        }).select('-password');

        res.json(users);
    } catch (err) {
        next(err);
    }
};

export const searchListings: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { query } = req.query;
        const listings = await ProductListing.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { brand: { $regex: query, $options: 'i' } },
                { model: { $regex: query, $options: 'i' } }
            ]
        });

        res.json(listings);
    } catch (err) {
        next(err);
    }
};

// Activity Logs
export const getActivityLogs: RequestHandler = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { targetType, startDate, endDate } = req.query;
        
        const filters: any = {};
        if (targetType) filters.targetType = targetType as string;
        if (startDate) filters.startDate = new Date(startDate as string);
        if (endDate) filters.endDate = new Date(endDate as string);

        const logs = await loggingService.getActivityLogs(filters);
        res.json(logs);
    } catch (err) {
        next(err);
    }
};