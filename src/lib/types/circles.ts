export type CreateCircleRequest = {
  name: string;
  description: string;
  createdBy: string;
  creatorAvatarUrl: string;
  region: {
    name: string;
    latitude: number;
    longitude: number;
  };
};

export type CreateCircleResponse = {
  data: {
    id: string;
    name: string;
    description: string;
    createdBy: string;
    creatorAvatarUrl: string;
    region: {
      name: string;
      latitude: number;
      longitude: number;
    };
  };
  success: boolean;
};
