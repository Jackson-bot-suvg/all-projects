import { Request, Response, NextFunction } from 'express';
import User from '../models/userModel';

import VerificationToken from '../models/verificationToken';
import { emailService } from '../services/emailService';
import crypto from 'crypto';
import { CustomRequest, CartItem } from '../types/CustomRequest';
import ProductListing from '../models/productListingModel';

interface OutCartItem {
  phoneId: string;
  title:   string;
  price:   number;
  quantity:number;
  stock:    number;
}

export const getCart = async (
  req: CustomRequest, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId!;
    const user = await User.findById(userId).populate('cart.product');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const cart: OutCartItem[] = user!.cart.map(item => {
      const prod = item.product as any;
      return {
        phoneId:  prod._id.toString(),
        title:    prod.title,
        price:    prod.price,
        quantity: item.quantity,
        stock:    prod.stock, 
      };
    });
    res.json(cart);
    return;
  } catch (err) {
    next(err);
  }
};


export const addToCart = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
  try {
    const { phoneId, quantity = 1 } = req.body;
    const userId = req.user?.userId;

    const product = await ProductListing.findById(phoneId);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      res.status(400).json({ message: "Quantity must be a positive integer" });
      return;
    }
    
    if (quantity > product.stock) {
      res.status(400).json({ message: "Quantity exceeds stock" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const existingItem = user.cart.find(item => item.product.toString() === phoneId);
    if (existingItem) {
      if (existingItem.quantity + quantity > product.stock) {
        res.status(400).json({ message: "Exceeds stock" });
        return;
      }
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ product: phoneId, quantity });
    }

    await user.save();
    await user.populate('cart.product');
    const cart: OutCartItem[] = user.cart.map(item => {
      const prod = item.product as any;
      return {
        phoneId:  prod._id.toString(),
        title:    prod.title,
        price:    prod.price,
        quantity: item.quantity,
        stock:    prod.stock,
      };
    });

    res.json(cart);
    return;
  } catch (err) {
    next(err);
  }
};

export const addToWishlist = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { phoneId } = req.body;
    const userId = req.user?.userId;

    const product = await ProductListing.findById(phoneId);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!user.wishlist.includes(phoneId)) {
      user.wishlist.push(phoneId);
      await user.save();
    }

    res.json(user.wishlist);
  } catch (err) {
    next(err);
  }
};


export const updateProfile = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { firstname, lastname } = req.body;

        if (!firstname || !lastname) {
            res.status(400).json({ message: 'First name and last name are required' });
            return;
        }

        const user = await User.findById(req.user?.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Update user information
        user.firstname = firstname;
        user.lastname = lastname;
        
        await user.save();

        res.json({
            user: {
                _id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
            return;
        }
    }
};

export const verifyPassword = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { password } = req.body;

        if (!password) {
            res.status(400).json({ message: 'Password is required' });
            return;
        }

        const user = await User.findById(req.user?.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid password' });
            return;
        }

        res.json({ message: 'Password verified successfully' });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
            return;
        }
    }
};

export const changePassword = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            res.status(400).json({ message: 'Both old and new passwords are required' });
            return;
        }

        const user = await User.findById(req.user?.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            res.status(401).json({ message: 'Current password is incorrect' });
            return;
        }

        user.password = newPassword;
        await user.save();

        // Send confirmation email
        await emailService.sendPasswordChangeConfirmation(user.email);

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
            return;
        }
    }
};

export const getUserInfo = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user?.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json({
            user: {
                _id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
            return;
        }
    }
};

/**
 * Request email change
 * Sends a confirmation email to the current email address
 */
export const requestEmailChange = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { newEmail, password } = req.body;

        if (!newEmail || !password) {
            res.status(400).json({ message: 'New email and password are required' });
            return;
        }

        const user = await User.findById(req.user?.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Verify current password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Current password is incorrect' });
            return;
        }

        // Check if new email is different from current email
        if (newEmail === user.email) {
            res.status(400).json({ message: 'New email must be different from current email' });
            return;
        }

        // Check if new email is already in use
        const existingUser = await User.findOne({ email: newEmail });
        if (existingUser) {
            res.status(400).json({ message: 'Email is already in use' });
            return;
        }

        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');

        // Create verification token document
        await VerificationToken.create({
            userId: user._id,
            token,
            email: user.email,
            newEmail,
            type: 'email'
        });

        // Send confirmation email to current email address
        await emailService.sendEmailChangeConfirmation(user.email, newEmail, token);

        res.json({ message: 'Email change confirmation sent to your current email address' });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
            return;
        }
    }
};

/**
 * Confirm email change
 * Updates the user's email if the token is valid
 */
export const confirmEmailChange = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;

        // Find and validate token
        const verificationToken = await VerificationToken.findOne({ token, type: 'email' });
        if (!verificationToken || !verificationToken.newEmail) {
            res.status(400).json({ 
                success: false,
                message: 'Invalid or expired token' 
            });
            return;
        }

        // Find user
        const user = await User.findById(verificationToken.userId);
        if (!user) {
            res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
            return;
        }

        // Update user's email
        const oldEmail = user.email;
        user.email = verificationToken.newEmail;
        user.verified = true; // Keep the user verified since they confirmed through old email
        await user.save();

        // Delete the verification token
        await verificationToken.deleteOne();

        // Send notification to old email
        await emailService.sendEmailChangeNotification(oldEmail);

        res.json({ 
            success: true,
            message: 'Email changed successfully. You can now log in with your new email address.',
            user: {
                _id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (err) {
        console.error('Email change confirmation error:', err);
        res.status(500).json({ 
            success: false,
            message: 'An error occurred during email change confirmation' 
        });
    }
};

/**
 * Validate email change token
 * Returns the new email address if token is valid
 */
export const validateEmailChangeToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;

        // Find and validate token
        const verificationToken = await VerificationToken.findOne({ token });
        if (!verificationToken || !verificationToken.newEmail) {
            res.status(400).json({ message: 'Invalid or expired token' });
            return;
        }

        res.json({ 
            valid: true,
            newEmail: verificationToken.newEmail
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
            return;
        }
    }
}; 

export const getWishlist = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId).populate('wishlist');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return; 
    }
    res.json(user.wishlist);
  } catch (err) {
    next(err);
  }
};

export const updateCartItem = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phoneId, quantity } = req.body;
    const userId = req.user?.userId;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      res.status(400).json({ message: "Quantity must be a positive integer" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const cartItem = user.cart.find(item => item.product.toString() === phoneId);
    if (!cartItem) {
      res.status(404).json({ message: "Item not found in cart" });
      return;
    }

    const product = await ProductListing.findById(phoneId);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    if (quantity > product.stock) {
      res.status(400).json({ message: "Quantity exceeds stock" });
      return;
    }

    cartItem.quantity = quantity;
    await user.save();
    await user.populate('cart.product');

    const cart: OutCartItem[] = user.cart.map(item => {
      const prod = item.product as any;
      return {
        phoneId:  prod._id.toString(),
        title:    prod.title,
        price:    prod.price,
        quantity: item.quantity,
        stock:    prod.stock,
      };
    });

    res.json(cart);
  } catch (err) {
    next(err);
  }
};

export const removeFromCart = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phoneId } = req.body;
    const userId = req.user?.userId;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.cart = user.cart.filter(item => item.product.toString() !== phoneId);
    await user.save();
    await user.populate('cart.product');

    const cart: OutCartItem[] = user.cart.map(item => {
      const prod = item.product as any;
      return {
        phoneId:  prod._id.toString(),
        title:    prod.title,
        price:    prod.price,
        quantity: item.quantity,
        stock:    prod.stock,
      };
    });

    res.json(cart);
  } catch (err) {
    next(err);
  }
};

export const clearCart = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.cart = [];
    await user.save();

    res.json([]);
  } catch (err) {
    next(err);
  }
};

export const getMyListings = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId!;
    const listings = await ProductListing.find({ seller: userId }).lean();
    res.status(200).json({ listings });
  } catch (err) {
    next(err);
  }
};

export const toggleCommentVisibility = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { listingId, reviewId } = req.params;
    const userId = req.user?.userId || req.session?.userId;

    const listing = await ProductListing.findOne({ _id: listingId, owner: userId });
    if (!listing) {
      res.status(403).json({ message: 'No permission' });
      return;
    }

    const review = listing.reviews.id(reviewId);
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    review.hidden = !review.hidden;
    await listing.save();

    res.json({ success: true, hidden: review.hidden });
  } catch (err) {
    next(err);
  }
};

export const getMyWrittenReviews = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const listings = await ProductListing.find({ seller: userId })
      .populate('reviews.reviewer', 'firstname lastname email')
      .lean();
      const myReviews: {
        _id: any;
        listingId: any;
        listingTitle: string;
        brand: string;
        rating: number;
        comment: string;
        hidden: boolean;
        createdAt: any;
        reviewer: any;
      }[] = [];
    listings.forEach(listing => {
      listing.reviews.forEach((review: any) => {
        myReviews.push({
          _id: review._id,
          listingId: listing._id,
          listingTitle: listing.title,
          brand: listing.brand,
          rating: review.rating,
          comment: review.comment,
          hidden: review.hidden,
          createdAt: review.createdAt,
          reviewer: review.reviewer,
        });
      });
    });

    res.json(myReviews);
    return;
  } catch (err) {
    next(err);
  }
};