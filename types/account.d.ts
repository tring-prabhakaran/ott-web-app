import type { CommonResponse, ProfilesData } from '@inplayer-org/inplayer.js';

import type { SerializedWatchHistoryItem } from './watchHistory';
import type { SerializedFavorite } from './favorite';

import type { Config } from '#types/Config';

export type AuthData = {
  jwt: string;
  refreshToken: string;
};

export type JwtDetails = {
  customerId: string;
  exp: number;
  publisherId: number;
};

export type PayloadWithIPOverride = {
  customerIP?: string;
};

export type AuthArgs = {
  config: Config;
  email: string;
  password: string;
};

export type AuthResponse = {
  auth: AuthData;
  user: Customer;
  customerConsents: CustomerConsent[];
};

export type LoginPayload = PayloadWithIPOverride & {
  email: string;
  password: string;
  offerId?: string;
  publisherId?: string;
};

export type LoginFormData = {
  email: string;
  password: string;
};

export type RegistrationFormData = {
  email: string;
  password: string;
};

export type ForgotPasswordFormData = {
  email: string;
};

export type DeleteAccountFormData = {
  password: string;
};

export type EditPasswordFormData = {
  email?: string;
  oldPassword?: string;
  password: string;
  passwordConfirmation: string;
  resetPasswordToken?: string;
};

export type OfferType = 'svod' | 'tvod';

export type ChooseOfferFormData = {
  offerId?: string;
};

export type RegisterPayload = PayloadWithIPOverride & {
  email: string;
  password: string;
  offerId?: string;
  publisherId?: string;
  locale: string;
  country: string;
  currency: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
  externalData?: string;
};

export type RegisterArgs = {
  config: Config;
  user: RegisterPayload;
};
export type CaptureFirstNameLastName = {
  firstName: string;
  lastName: string;
};

export type CleengCaptureField = {
  key: string;
  enabled: boolean;
  required: boolean;
  answer: string | Record<string, string | null> | null;
};

export type CleengCaptureQuestionField = {
  key: string;
  enabled: boolean;
  required: boolean;
  value: string;
  question: string;
  answer: string | null;
};

export type PersonalDetailsFormData = {
  firstName: string;
  lastName: string;
  birthDate: string;
  companyName: string;
  phoneNumber: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  postCode: string;
  country: string;
};

export type GetPublisherConsentsPayload = {
  publisherId: string;
};

export type GetPublisherConsentsResponse = {
  consents: Consent[];
};

export type GetCustomerConsentsPayload = {
  customerId: string;
};

export type GetCustomerConsentsResponse = {
  consents: CustomerConsent[];
};

export type ResetPasswordPayload = {
  customerEmail: string;
  offerId?: string;
  publisherId?: string;
  resetUrl?: string;
};

export type ChangePasswordPayload = {
  customerEmail: string;
  publisherId: string;
  resetPasswordToken: string;
  newPassword: string;
};

export type ChangePasswordWithTokenPayload = {
  customerEmail?: string;
  publisherId?: string;
  resetPasswordToken: string;
  newPassword: string;
  newPasswordConfirmation: string;
};

export type changePasswordWithOldPasswordPayload = {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
};

export type GetCustomerPayload = {
  customerId: string;
};

export type UpdateCustomerPayload = {
  id?: string;
  email?: string;
  confirmationPassword?: string;
  firstName?: string;
  lastName?: string;
  externalData?: ExternalData;
};

export type ExternalData = {
  history?: SerializedWatchHistoryItem[];
  favorites?: SerializedFavorite[];
};

export type UpdateCustomerConsentsPayload = {
  id?: string;
  consents: CustomerConsent[];
};

export type Customer = {
  id: string;
  email: string;
  country: string;
  regDate: string;
  lastLoginDate?: string;
  lastUserIp: string;
  firstName?: string;
  metadata?: Record<string, unknown>;
  lastName?: string;
  fullName?: string;
  uuid?: string;
  externalId?: string;
  externalData?: ExternalData;
};

export type UpdateCustomerArgs = {
  id?: string | undefined;
  email?: string | undefined;
  confirmationPassword?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
  externalData?: ExternalData | undefined;
  metadata?: Record<string>;
  fullName?: string;
};

export type CustomRegisterFieldVariant = 'input' | 'select' | 'country' | 'us_state' | 'radio' | 'checkbox' | 'datepicker';

export interface Consent {
  type?: CustomRegisterFieldVariant;
  isCustomRegisterField?: boolean;
  enabledByDefault?: boolean;
  defaultValue?: string;
  name: string;
  label: string;
  placeholder: string;
  required: boolean;
  options: Record<string, string>;
  version: string;
}

export type CustomerConsent = {
  customerId?: string;
  date?: number;
  label?: string;
  name: string;
  needsUpdate?: boolean;
  newestVersion?: string;
  required?: boolean;
  state: 'accepted' | 'declined';
  value?: string | boolean;
  version: string;
};

export type CustomerConsentArgs = {
  config: Config;
  customerId?: string;
  customer?: Customer;
};

export type UpdateCustomerConsentsArgs = {
  config: Config;
  customer: Customer;
  consents: CustomerConsent[];
};

export type LocalesData = {
  country: string;
  currency: string;
  locale: string;
  ipAddress: string;
};

export type GetCaptureStatusPayload = {
  customerId: string;
};

export type GetCaptureStatusResponse = {
  isCaptureEnabled: boolean;
  shouldCaptureBeDisplayed: boolean;
  settings: Array<CleengCaptureField | CleengCaptureQuestionField>;
};

export type CaptureCustomAnswer = {
  questionId: string;
  question: string;
  value: string;
};

export type Capture = {
  firstName?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  postCode?: string;
  country?: string;
  birthDate?: string;
  companyName?: string;
  phoneNumber?: string;
  customAnswers?: CaptureCustomAnswer[];
};

export type GetCaptureStatusArgs = {
  customer: Customer;
};

export type UpdateCaptureStatusArgs = {
  customer: Customer;
} & Capture;

export type UpdateCaptureAnswersPayload = {
  customerId: string;
} & Capture;

export type UpdatePersonalShelvesArgs = {
  id: string;
  externalData: {
    history?: SerializedWatchHistoryItem[];
    favorites?: SerializedFavorite[];
  };
};

export type Profile = ProfilesData;

export type ProfilePayload = {
  id?: string;
  name: string;
  adult: boolean;
  avatar_url?: string;
  pin?: number;
};

export type EnterProfilePayload = {
  id: string;
  pin?: number;
};

export type ProfileDetailsPayload = {
  id: string;
};

export type ListProfilesResponse = {
  canManageProfiles: boolean;
  collection: ProfilesData[];
};

export type FirstLastNameInput = {
  firstName: string;
  lastName: string;
  metadata?: Record<string, string>;
};

export type EmailConfirmPasswordInput = {
  email: string;
  confirmationPassword: string;
};

export type CommonAccountResponse = {
  message: string;
  code: number;
  errors?: Record<string, string>;
};

export type DeleteAccountPayload = {
  password: string;
};

export type SubscribeToNotificationsPayload = {
  uuid: string;
  onMessage: (payload: string) => void;
};

export type SocialURLs = {
  facebook: string;
  twitter: string;
  google: string;
};

type Login = PromiseRequest<AuthArgs, AuthResponse>;
type Register = PromiseRequest<AuthArgs, AuthResponse>;
type GetCustomer = EnvironmentServiceRequest<GetCustomerPayload, Customer>;
type UpdateCustomer = EnvironmentServiceRequest<UpdateCustomerArgs, Customer>;
type GetPublisherConsents = PromiseRequest<Config, GetPublisherConsentsResponse>;
type GetCustomerConsents = PromiseRequest<CustomerConsentArgs, GetCustomerConsentsResponse>;
type UpdateCustomerConsents = PromiseRequest<UpdateCustomerConsentsArgs, GetCustomerConsentsResponse>;
type GetCaptureStatus = EnvironmentServiceRequest<GetCaptureStatusArgs, GetCaptureStatusResponse>;
type UpdateCaptureAnswers = EnvironmentServiceRequest<UpdateCaptureStatusArgs, Capture>;
type ResetPassword = EnvironmentServiceRequest<ResetPasswordPayload, Record<string, unknown>>;
type ChangePassword = EnvironmentServiceRequest<ChangePasswordWithTokenPayload, ApiResponse<unknown>>;
type ChangePasswordWithOldPassword = EnvironmentServiceRequest<ChangePasswordWithOldPasswordPayload, ApiResponse<unknown>>;
type UpdatePersonalShelves = EnvironmentServiceRequest<UpdatePersonalShelvesArgs, Customer | Record<string>>;
type GetLocales = EmptyServiceRequest<LocalesData>;
type ExportAccountData = EnvironmentServiceRequest<undefined, CommonAccountResponse>;
type SocialURLSData = PromiseRequest<Config, SocialURLs[]>;
type NotificationsData = PromiseRequest<SubscribeToNotificationsPayload, boolean>;
type DeleteAccount = EnvironmentServiceRequest<DeleteAccountPayload, CommonAccountResponse>;
type ListProfiles = EnvironmentServiceRequest<undefined, ListProfilesResponse>;
type CreateProfile = EnvironmentServiceRequest<ProfilePayload, ProfilesData>;
type UpdateProfile = EnvironmentServiceRequest<ProfilePayload, ProfilesData>;
type EnterProfile = EnvironmentServiceRequest<EnterProfilePayload, ProfilesData>;
type GetProfileDetails = EnvironmentServiceRequest<ProfileDetailsPayload, ProfilesData>;
type DeleteProfile = EnvironmentServiceRequest<ProfileDetailsPayload, CommonAccountResponse>;
