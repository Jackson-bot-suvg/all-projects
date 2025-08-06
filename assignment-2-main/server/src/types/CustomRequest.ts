import { Request } from 'express';
import { Session, SessionData } from 'express-session';

export interface CartItem {
    phoneId: string;
    quantity: number;
  }

declare module 'express-session' {
    interface SessionData {
      userId?: string;
      isAdmin?: boolean;
      cart?: CartItem[];
    }
  }

  export interface CustomRequest extends Request {
    session: Session & Partial<SessionData>;
    user?: {
      userId: string;
      isAdmin: boolean;
    };
  }
