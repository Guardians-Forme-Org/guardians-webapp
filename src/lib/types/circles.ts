export type CreateCircleRequest = {
  name: string;
  description: string;
  createdBy: string;
  creatorAvatarUrl: string;
  channelLink: string;
  region: {
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

export type CircleMember = {
  circleId: string;
  userId: string;
  joinedAt: string;
  role: string;
  avatarUrl: string;
  permissions: string[];
};

export type ApiCircle = {
  id: string;
  circleId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  region: {
    id: string;
    latitude: number;
    longitude: number;
    address: string;
    what3words: string;
  };
  challenges: unknown[];
  circleLead: null | unknown;
  members: CircleMember[];
  joinLink: string;
  createdBy: string;
  bannerUrl: string;
};

export type CreateCircleResponse = ApiCircle;

export type CirclesListResponse = ApiCircle[];
