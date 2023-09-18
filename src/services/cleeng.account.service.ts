import jwtDecode from 'jwt-decode';
import { inject, injectable } from 'inversify';

import type AccountService from './account.service';

import type CleengService from '#src/services/cleeng.service';
import type { Config } from '#types/Config';
import { getOverrideIP } from '#src/utils/common';
import type {
  ChangePassword,
  GetCustomer,
  GetCustomerConsents,
  GetPublisherConsents,
  Login,
  Register,
  ResetPassword,
  UpdateCustomer,
  UpdateCustomerConsents,
  GetCaptureStatus,
  UpdateCaptureAnswers,
  AuthData,
  JwtDetails,
  GetCustomerConsentsResponse,
  GetCaptureStatusResponse,
  Capture,
  GetLocales,
  LoginPayload,
  RegisterPayload,
  UpdateCaptureAnswersPayload,
  UpdateCustomerConsentsPayload,
  UpdateCustomerPayload,
  ChangePasswordWithOldPassword,
  UpdatePersonalShelves,
  NotificationsData,
  ExportAccountData,
  SocialURLSData,
  DeleteAccount,
} from '#types/account';
import { SERVICES } from '#src/ioc/types';

@injectable()
export default class CleengAccountService implements AccountService {
  private cleengService: CleengService;

  public canUpdateEmail = true;
  public canSupportEmptyFullName = true;
  public canChangePasswordWithOldPassword = false;
  public canRenewSubscription = true;
  public canExportAccountData = false;
  public canDeleteAccount = false;
  public canUpdatePaymentMethod = true;
  public canShowReceipts = true;

  constructor(@inject(SERVICES.Cleeng) cleengService: CleengService) {
    this.cleengService = cleengService;
  }

  private handleErrors = (errors: ApiResponse['errors']) => {
    if (errors.length > 0) {
      throw new Error(errors[0]);
    }
  };

  private getCustomerIdFromAuthData = (auth: AuthData) => {
    const decodedToken: JwtDetails = jwtDecode(auth.jwt);
    return decodedToken.customerId;
  };

  initialize = async (config: Config, logoutCallback: () => Promise<void>) => {
    await this.cleengService.initialize(!!config.integrations.cleeng?.useSandbox, logoutCallback);
  };

  getAuthData = async () => {
    if (this.cleengService.tokens) {
      return {
        jwt: this.cleengService.tokens.accessToken,
        refreshToken: this.cleengService.tokens.refreshToken,
      } as AuthData;
    }

    return null;
  };

  login: Login = async ({ config, email, password }) => {
    const payload: LoginPayload = {
      email,
      password,
      publisherId: config.integrations.cleeng?.id || '',
      customerIP: getOverrideIP(),
    };

    const { responseData: auth, errors }: ServiceResponse<AuthData> = await this.cleengService.post(
      !!config.integrations.cleeng?.useSandbox,
      '/auths',
      JSON.stringify(payload),
    );
    this.handleErrors(errors);

    await this.cleengService.setTokens({ accessToken: auth.jwt, refreshToken: auth.refreshToken });

    const { user, customerConsents } = await this.getUser({ config });

    return {
      user,
      auth,
      customerConsents,
    };
  };

  register: Register = async ({ config, email, password }) => {
    const localesResponse = await this.getLocales(!!config.integrations.cleeng?.useSandbox);

    this.handleErrors(localesResponse.errors);

    const payload: RegisterPayload = {
      email,
      password,
      locale: localesResponse.responseData.locale,
      country: localesResponse.responseData.country,
      currency: localesResponse.responseData.currency,
      publisherId: config.integrations.cleeng?.id || '',
      customerIP: getOverrideIP(),
    };

    const { responseData: auth, errors }: ServiceResponse<AuthData> = await this.cleengService.post(
      !!config.integrations.cleeng?.useSandbox,
      '/customers',
      JSON.stringify(payload),
    );
    this.handleErrors(errors);

    await this.cleengService.setTokens({ accessToken: auth.jwt, refreshToken: auth.refreshToken });

    const { user, customerConsents } = await this.getUser({ config });

    return {
      user,
      auth,
      customerConsents,
    };
  };

  logout = async () => {
    // clear the persisted access tokens
    await this.cleengService.clearTokens();
  };

  getUser = async ({ config }: { config: Config }) => {
    const authData = await this.getAuthData();

    if (!authData) throw new Error('Not logged in');

    const customerId = this.getCustomerIdFromAuthData(authData);
    const { responseData: user, errors } = await this.getCustomer({ customerId }, !!config.integrations.cleeng?.useSandbox);

    this.handleErrors(errors);

    const consentsPayload = {
      config,
      customer: user,
    };

    const { consents } = await this.getCustomerConsents(consentsPayload);

    return {
      user,
      customerConsents: consents,
    };
  };

  getPublisherConsents: GetPublisherConsents = async (config) => {
    const { cleeng } = config.integrations;
    const response = await this.cleengService.get(!!cleeng?.useSandbox, `/publishers/${cleeng?.id}/consents`);

    this.handleErrors(response.errors);

    return { consents: response?.responseData?.consents || [] };
  };

  getCustomerConsents: GetCustomerConsents = async (payload) => {
    const { config, customer } = payload;
    const { cleeng } = config.integrations;

    const response: ServiceResponse<GetCustomerConsentsResponse> = await this.cleengService.get(!!cleeng?.useSandbox, `/customers/${customer?.id}/consents`, {
      authenticate: true,
    });

    this.handleErrors(response.errors);

    return {
      consents: response?.responseData?.consents || [],
    };
  };

  updateCustomerConsents: UpdateCustomerConsents = async (payload) => {
    const { config, customer } = payload;
    const { cleeng } = config.integrations;

    const params: UpdateCustomerConsentsPayload = {
      id: customer.id,
      consents: payload.consents,
    };

    const response: ServiceResponse<never> = await this.cleengService.put(!!cleeng?.useSandbox, `/customers/${customer?.id}/consents`, JSON.stringify(params), {
      authenticate: true,
    });
    this.handleErrors(response.errors);

    return await this.getCustomerConsents(payload);
  };

  getCaptureStatus: GetCaptureStatus = async ({ customer }, sandbox) => {
    const response: ServiceResponse<GetCaptureStatusResponse> = await this.cleengService.get(sandbox, `/customers/${customer?.id}/capture/status`, {
      authenticate: true,
    });

    this.handleErrors(response.errors);

    return response;
  };

  updateCaptureAnswers: UpdateCaptureAnswers = async ({ customer, ...payload }, sandbox) => {
    const params: UpdateCaptureAnswersPayload = {
      customerId: customer.id,
      ...payload,
    };

    const response: ServiceResponse<Capture> = await this.cleengService.put(sandbox, `/customers/${customer.id}/capture`, JSON.stringify(params), {
      authenticate: true,
    });
    this.handleErrors(response.errors);

    const { responseData, errors } = await this.getCustomer({ customerId: customer.id }, sandbox);
    this.handleErrors(errors);

    return {
      errors: [],
      responseData,
    };
  };

  resetPassword: ResetPassword = async (payload, sandbox) => {
    return this.cleengService.put(sandbox, '/customers/passwords', JSON.stringify(payload));
  };

  changePasswordWithResetToken: ChangePassword = async (payload, sandbox) => {
    return this.cleengService.patch(sandbox, '/customers/passwords', JSON.stringify(payload));
  };

  changePasswordWithOldPassword: ChangePasswordWithOldPassword = async () => {
    return {
      errors: [],
      responseData: {},
    };
  };

  updateCustomer: UpdateCustomer = async (payload, sandbox) => {
    const { id, metadata, fullName, ...rest } = payload;
    const params: UpdateCustomerPayload = {
      id,
      ...rest,
    };
    // enable keepalive to ensure data is persisted when closing the browser/tab
    return this.cleengService.patch(sandbox, `/customers/${id}`, JSON.stringify(params), { authenticate: true, keepalive: true });
  };

  getCustomer: GetCustomer = async (payload, sandbox) => {
    return this.cleengService.get(sandbox, `/customers/${payload.customerId}`, { authenticate: true });
  };

  getLocales: GetLocales = async (sandbox) => {
    return this.cleengService.getLocales(sandbox);
  };

  updatePersonalShelves: UpdatePersonalShelves = async (payload, sandbox) => {
    return await this.updateCustomer(payload, sandbox);
  };

  subscribeToNotifications: NotificationsData = async () => {
    return false;
  };

  getSocialUrls: SocialURLSData = async () => {
    return [];
  };

  exportAccountData: ExportAccountData = () => {
    throw new Error('Method is not supported');
  };

  deleteAccount: DeleteAccount = () => {
    throw new Error('Method is not supported');
  };
}
