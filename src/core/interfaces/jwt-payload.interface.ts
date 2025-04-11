export interface JwtPayload {
  sub: string;
  isRefreshToken?: boolean; // Optional field to identify refresh tokens
}
