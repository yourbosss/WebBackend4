import { Request } from 'express';
import { UserRole } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
      };
      file?: Multer.File;
    }

    interface Response {
      locals: {
        user?: {
          userId: string;
          role: UserRole;
        };
      };
    }

    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

export type TypedAuthenticatedRequest<
  P = Record<string, unknown>,
  B = unknown,
  Q = Record<string, unknown>
> = AuthenticatedRequest & Request<P, unknown, B, Q>;
