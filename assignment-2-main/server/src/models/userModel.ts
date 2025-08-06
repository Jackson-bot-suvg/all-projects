import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

interface ICartItem {
    product: mongoose.Types.ObjectId;
    quantity: number;
}

export interface IUser extends Document {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    verified: boolean;
    disabled: boolean;
    lastLogin?: Date;
    registrationDate?: Date;
    wishlist: mongoose.Types.ObjectId[];
    cart: ICartItem[];
    isAdmin: boolean;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const cartItemSchema = new Schema<ICartItem>({
    product: { type: Schema.Types.ObjectId, ref: 'ProductListing', required: true },
    quantity: { type: Number, min: 1, required: true }
}, { _id: false });

const userSchema = new Schema<IUser>({
    firstname: { type: String, required: true, trim: true },
    lastname:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:  { type: String, required: true, minlength: 8 },
    isAdmin:     { type: Boolean, default: false },
    verified:  { type: Boolean, default: false },
    disabled:  { type: Boolean, default: false },
    lastLogin: { type: Date },
    registrationDate: { type: Date, default: Date.now },
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'ProductListing' }],
    cart: [cartItemSchema]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err: any) {
        next(err);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword: string) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
