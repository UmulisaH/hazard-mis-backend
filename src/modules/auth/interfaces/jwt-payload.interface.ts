export interface JwtPayload {
  sub: string;
  email: string;
  is_safety_officer: boolean;
  is_admin: boolean;
}
