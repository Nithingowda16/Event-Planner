import jwt from 'jsonwebtoken';
import { User, type IUser } from '../models/user.model.js';
import { envConfig } from '../config/env.js';
import type { RegisterInput, LoginInput, UserProfile } from '@celebrateos/shared';

export interface AuthTokenPayload {
  id: string;
  email: string;
}

export interface AuthResult {
  user: UserProfile;
  token: string;
}

export class AuthError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export function generateToken(payload: AuthTokenPayload): string {
  // Use as any for jwt.SignOptions to satisfy typescript typings cleanly
  return jwt.sign(payload, envConfig.JWT_SECRET, {
    expiresIn: envConfig.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, envConfig.JWT_SECRET) as AuthTokenPayload;
    if (!decoded || !decoded.id || !decoded.email) {
      throw new AuthError(401, 'Invalid authentication token');
    }
    return decoded;
  } catch (err: unknown) {
    if (err instanceof AuthError) throw err;
    throw new AuthError(401, 'Authentication token is invalid or has expired');
  }
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const normalizedEmail = input.email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail }).lean();
  if (existingUser) {
    throw new AuthError(409, 'An account with this email address already exists');
  }

  const passwordHash = await User.hashPassword(input.password);

  const newUser: IUser = await User.create({
    email: normalizedEmail,
    passwordHash,
    fullName: input.fullName.trim(),
  });

  const token = generateToken({
    id: newUser._id.toString(),
    email: newUser.email,
  });

  return {
    user: {
      id: newUser._id.toString(),
      email: newUser.email,
      fullName: newUser.fullName,
      createdAt: newUser.createdAt.toISOString(),
    },
    token,
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const normalizedEmail = input.email.toLowerCase().trim();

  // Find user by email
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    // Generic error to prevent user enumeration
    throw new AuthError(401, 'Invalid email or password');
  }

  // Verify password with bcrypt
  const isPasswordValid = await user.comparePassword(input.password);
  if (!isPasswordValid) {
    // Generic error to prevent user enumeration
    throw new AuthError(401, 'Invalid email or password');
  }

  const token = generateToken({
    id: user._id.toString(),
    email: user.email,
  });

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new AuthError(404, 'User not found');
  }

  return {
    id: user._id.toString(),
    email: user.email,
    fullName: user.fullName,
    createdAt: (user as unknown as { createdAt: Date }).createdAt.toISOString(),
  };
}
