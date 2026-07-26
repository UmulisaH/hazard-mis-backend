export interface AuthenticatedUser {
  id: string;
  email: string;
  isSafetyOfficer: boolean;
  isAdmin: boolean;
}
