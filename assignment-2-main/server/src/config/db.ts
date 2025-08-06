import mongoose from 'mongoose';


const uri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/old_phone_deals';

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log('DB Connection Established');
    console.log(`Connected to MongoDB at ${uri}`);
  } catch (err) {
    console.error('Error connecting to MongoDB');
    if (err instanceof Error) {
      console.error('Message:', err.message);
    }
    process.exit(1);
  }
}

export default connectDB;