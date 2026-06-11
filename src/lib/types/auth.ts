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
    placeId: string;
    city: string;
    suburb: string;
    province: string;
    country: string;
    countryCode: string;
    postalCode: string;
    latitude: number;
    longitude: number;
    formattedAddress: string;
  };
};

export type UserLocation = {
  // legacy shape
  address?: string;
  id?: string;
  what3words?: string;
  // new shape (matches LocationResult)
  placeId?: string;
  city?: string;
  suburb?: string;
  province?: string;
  country?: string;
  countryCode?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
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
