import bcrypt from 'bcrypt';
import fs from 'node:fs';
import path from 'node:path';
import User from '../models/userModel';
import ProductListing from '../models/productListingModel';
import { getBrandImage } from '../config/brandImages';

const createAdminUser = async (force = false) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@oldphonedeals.com';
  
  // Check if admin already exists
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin && !force) {
    console.log('Admin user already exists');
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123！';
  const adminUser = {
    firstname: 'Admin',
    lastname: 'User',
    email: adminEmail,
    password: adminPassword,
    isAdmin: true,
    verified: true,
    disabled: false,
    registrationDate: new Date(),
    lastLogin: new Date()
  };

  if (existingAdmin) {
    // Update existing admin if force is true
    await User.findByIdAndUpdate(existingAdmin._id, adminUser);
    console.log('Admin user updated');
  } else {
    // Create new admin user
    await User.create(adminUser);
    console.log('Admin user created');
  }
};

const initializeDB = async () => {
  try {
    // Always try to create/update admin user first
    await createAdminUser();

    const userCount = await User.countDocuments();
    const listingCount = await ProductListing.countDocuments();
    
    // Only initialize demo data if database is empty
    if (userCount > 1 || listingCount !== 0) {
      console.log('Database already contains data, skipping demo data initialization');
      return;
    }

    const userFilePath = path.resolve(__dirname, 'userlist.json');
    const phoneListingPath = path.resolve(__dirname, 'phonelisting.json');

    const users = JSON.parse(fs.readFileSync(userFilePath, { encoding: 'utf8', flag: 'r' }));
    const phoneListings = JSON.parse(fs.readFileSync(phoneListingPath, { encoding: 'utf8', flag: 'r' }))

    const password = 'DemoPassword1917';
    const hash = bcrypt.hashSync(password, 12);

    const usersFormatted = users.map((user:any) => {
      return {
        ...user,
        _id: user._id.$oid,
        password: hash,
        verified: false,
        disabled: false,
        registrationDate: new Date(),
        isAdmin: false
      }
    });

    phoneListings.forEach((listing: any) => {
      listing.image = getBrandImage(listing.brand);

      if (listing?.disabled == "") {
        listing.disabled = true;
      }

      listing.reviews.forEach((review:any) => {
        if (review?.hidden === "") {
          review.hidden = true;
        }
      })
    });

    // Insert demo data
    await User.insertMany(usersFormatted);
    await ProductListing.insertMany(phoneListings);

    console.log("Database initialized with demo data");
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err; // Re-throw to be caught by the app's error handler
  }
}

export default initializeDB;
