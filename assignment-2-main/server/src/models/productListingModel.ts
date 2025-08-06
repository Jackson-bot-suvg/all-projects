import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  reviewer: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  rating: {type: Number, min: 1, max: 5, required: true},
  comment: String,
  hidden: {type: Boolean, default: false}
}, {timestamps: true});

const productListingSchema = new mongoose.Schema({
  title: {type: String, required: true},
  brand: {type: String, required: true},
  image: {type: String, required: false},
  stock: {type: Number, min: 0, required: true},
  seller: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  price: {type: Number, min: 0, required: true},
  disabled: {type: Boolean, default: false},
  reviews: [reviewSchema]
}, {timestamps: true});

const ProductListing = mongoose.model('ProductListing', productListingSchema);
export default ProductListing;