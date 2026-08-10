export const PROFILE_CONFIG = {
  /**
   * When true, the "Circle" impact column on the profile page is computed
   * client-side by summing challenge impact records across all of the user's
   * circles, rather than using the circle-level records returned by the API.
   * Set to false to fall back to API data.
   */
  aggregateUserCircleImpact: true,
} as const;