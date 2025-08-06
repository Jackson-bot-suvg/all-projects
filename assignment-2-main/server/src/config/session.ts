import session from 'express-session';
import MongoStore from 'connect-mongo';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/old_phone_deals';

export const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'admin-session-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        collectionName: 'sessions',
        ttl: 2 * 60 * 60 // 2 hours in seconds
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 2 * 60 * 60 * 1000 // 2 hours in milliseconds
    }
}; 