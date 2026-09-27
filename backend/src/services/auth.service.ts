import { User, IUser } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { signAccessToken, issueRefreshToken } from './token.service';

export async function registerUser(name: string, email: string, password: string) {
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({ name, email, password });
  return issueTokensFor(user);
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const valid = await user.comparePassword(password);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  return issueTokensFor(user);
}

async function issueTokensFor(user: IUser) {
  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user);
  return { user, accessToken, refreshToken };
}
