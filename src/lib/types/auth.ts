export type LoginRequest = {
  username: string;
  password: string;
};

export type Language = {
  id: string;
  name: string;
  code: string;
};

export type RegisterRequest = {
  email: string;
  mobile: string;
  password: string;
  firstName: string;
  lastName: string;
  preferredLanguage: Language;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
};

export type UserLocation = {
  address: string;
  id: string;
  latitude: number;
  longitude: number;
  what3words: string;
};

export type UserMetadata = {
  avatarUrl: string;
  email: string;
  email_verified: boolean;
  firstName: string;
  id: string;
  lastName: string;
  location: UserLocation;
  mobile: string;
  phone_verified: boolean;
  preferredLanguage: { code: string; id: string; name: string };
  sub: string;
  username: string;
};

export type AuthUser = {
  id: string;
  aud: string;
  role: string;
  email: string;
  invited_at: string;
  confirmed_at: string;
  confirmation_sent_at: string;
  app_metadata: Record<string, unknown>;
  user_metadata: UserMetadata;
  created_at: string;
  updated_at: string;
};

export type AuthMetadata = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: AuthUser;
  provider_token: string;
  provider_refresh_token: string;
};

export type LoginResponseData = {
  id: string;
  email: string;
  preferredLanguage: Language;
  metaData: AuthMetadata;
};

export type LoginResponse = {
  data: LoginResponseData;
  success: boolean;
};

export type ApiError = {
  error: string;
};
