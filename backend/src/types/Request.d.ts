import { User } from "../user/User";

declare global {
  namespace Express {
    interface Request {
      user: User | null;
    }
  }
}
