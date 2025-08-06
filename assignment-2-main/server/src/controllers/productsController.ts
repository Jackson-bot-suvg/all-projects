import { Request, Response, NextFunction } from "express";
import ProductListing from "../models/productListingModel";
import { CustomRequest } from "../types/CustomRequest";
import { getBrandImage } from '../config/brandImages';


export const getById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const phone = await ProductListing.findById(req.params.id)
        .populate("seller")
        .populate("reviews.reviewer");

    if (!phone) {
      res.status(404).json({ message: "Phone not found" })
      return
    }

    phone.reviews = phone.reviews.filter(review => review.hidden !== true) as any;

    res.json(phone)
  } catch (err) {
    next(err)
  }
}

export const getBestSellers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bestSellers = await ProductListing.aggregate([
      {
        $match: {
          stock: { $gt: 0 },
          disabled: false
        }
      },
      {
        $addFields: {
          avgRating: { $avg: "$reviews.rating" },
        },
      },
      {
        $sort: {
          avgRating: -1,
        },
      },
      {
        $limit: 5,
      },
    ])

    res.json(bestSellers)
  } catch (err) {
    next(err)
  }
}

export const getSoldOutSoon = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const soldOutSoon = await ProductListing.aggregate([
      /* Only keep the goods that are still in stock and have not been banned */
      {
        $match: {
          stock: { $gt: 0 },
          disabled: false
        }
      },
      /* In ascending order of inventory: the less inventory there is, the higher it is placed */
      {
        $sort: { stock: 1 }
      },
      /* Only take the first five items */
      {
        $limit: 5
      }
    ]);

    res.json(soldOutSoon);
  } catch (err) {
    next(err);
  }
};


export const addReview = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { rating, comment } = req.body;
    const phone = await ProductListing.findById(req.params.id);

    if (!phone) {
      res.status(404).json({ message: "Phone not found" });
      return;
    }

    phone.reviews.push({
      reviewer: req.user?.userId,
      rating,
      comment
    });

    await phone.save();
    res.json(phone);
  } catch (err) {
    next(err);
  }
};

export const searchProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query, brand, minPrice, maxPrice } = req.query

    // Build the filter object
    const filter: any = { disabled: false }

    // Add search query filter if provided
    if (query && typeof query === "string") {
      filter.$or = [{ title: { $regex: query, $options: "i" } }, { brand: { $regex: query, $options: "i" } }]
    }

    // Add brand filter if provided
    if (brand && typeof brand === "string") {
      filter.brand = brand
    }

    // Add price range filter if provided
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }

    // Execute the query
    const products = await ProductListing.find(filter).populate("seller", "firstName lastName").limit(50) // Limit to 50 results for performance

    res.json(products)
  } catch (err) {
    next(err)
  }
}

export const getBrands = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get all unique brands
    const brands = await ProductListing.distinct("brand", { disabled: false })
    res.json(brands)
  } catch (err) {
    next(err)
  }
}

export const getPriceRange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get min and max prices
    const minPrice = await ProductListing.find({ disabled: false }).sort({ price: 1 }).limit(1).select("price")
    const maxPrice = await ProductListing.find({ disabled: false }).sort({ price: -1 }).limit(1).select("price")

    res.json({
      min: minPrice.length > 0 ? minPrice[0].price : 0,
      max: maxPrice.length > 0 ? maxPrice[0].price : 2000,
    })
  } catch (err) {
    next(err)
  }
}


export const createListing = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, stock, price, brand } = req.body;
    if (!title || stock === undefined || price === undefined || !brand) {
      res.status(400).json({ message: 'title, stock, price, brand are required' });
      return;
    }

    const listing = await ProductListing.create({
      title,
      brand,
      stock,
      price,
      image: getBrandImage(brand),
      disabled: false,
      seller: req.user?.userId
    });

    res.status(201).json({ listing });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

// POST /api/listings/:id/toggle  
export const toggleListing = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const listing = await ProductListing.findById(id);
    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }
    if (listing.seller.toString() !== req.user?.userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    listing.disabled = !listing.disabled;
    await listing.save();
    res.json({ listing });
  } catch (err) {
    next(err);
  }
};


// DELETE /api/listings/:id  
export const deleteListing = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const listing = await ProductListing.findById(id);
    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }
    if (listing.seller.toString() !== req.user?.userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    await listing.deleteOne();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
