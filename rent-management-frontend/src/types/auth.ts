export interface RegisterFormData {
  profileImage: File | null;
  fullName: string;
  username: string;
  email: string;
  mobileNumber: string;
  fullAddress: string;
  aadhaarNumber: string;
  aadhaarDocument: File | null;
  dateOfJoining: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export interface LoginFormData {
  identifier: string;
  password: string;
  rememberDevice: boolean;
}

export interface ResetPasswordFormData {
  email: string;
  otp: string[];
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordRuleState {
  hasUpper: boolean;
  hasLower: boolean;
  hasSpecial: boolean;
  hasMinLength: boolean;
  isMatch: boolean;
  score: number; // 0 to 4
  levelLabel: string;
}
