import { ENV } from "@/lib";
import {
  IApiGetLicenseKeysErrorResponse,
  IApiGetLicenseKeysSuccessResponse,
  IApiRegisterErrorResponse,
  IApiRegisterSuccessResponse,
  IApiUpgradeLicenseSuccessResponse,
  IApiUpgradeLicenseErrorResponse,
  IApiCreateLicenseKeySuccessResponse,
  IApiCreateLicenseKeyErrorResponse,
  IApiUpdateLicenseKeySuccessResponse,
  IApiUpdateLicenseKeyErrorResponse,
  IApiGetLicenseKeyByIdSuccessResponse,
  IApiGetLicenseKeyByIdErrorResponse,
  ICreateLicenseKeyRequest,
  IGenerateLicenseKeysRequest,
  IUpdateLicenseKeyRequest,
  IUpgradeLicenseRequest,
  IApiValidateLicenseSuccessResponse,
  IApiValidateLicenseErrorResponse,
  IApiActivateLicenseSuccessResponse,
  IApiActivateLicenseErrorResponse,
  IApiGetMeSuccessResponse,
  IApiGetMeErrorResponse,
  ILicensePayload,
} from "@/types/api.type";
import axios from "axios";

export class AuthApiService {
  static async loginUser(): Promise<
    IApiRegisterSuccessResponse | IApiRegisterErrorResponse
  > {
    const response = await axios.post(
      `${ENV.EXTERNAL_API_URL}/auth/login`, // URL của External API
      { email: ENV.EMAIL_API_URL, password: ENV.PASSWORD_API_URL } // Body
    );

    return response.data as
      | IApiRegisterSuccessResponse
      | IApiRegisterErrorResponse;
  }

  static async getMe(
    token: string
  ): Promise<IApiGetMeSuccessResponse | IApiGetMeErrorResponse> {
    const response = await axios.get(`${ENV.EXTERNAL_API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data as IApiGetMeSuccessResponse | IApiGetMeErrorResponse;
  }

  // License Keys Get
  static async getLicenseKeys(
    token: string
  ): Promise<
    IApiGetLicenseKeysSuccessResponse | IApiGetLicenseKeysErrorResponse
  > {
    const response = await axios.get(`${ENV.EXTERNAL_API_URL}/license-keys`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data as
      | IApiGetLicenseKeysSuccessResponse
      | IApiGetLicenseKeysErrorResponse;
  }

  static async getLicenseKeyById(
    token: string,
    id: string
  ): Promise<
    IApiGetLicenseKeyByIdSuccessResponse | IApiGetLicenseKeyByIdErrorResponse
  > {
    const response = await axios.get(
      `${ENV.EXTERNAL_API_URL}/license-keys/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data as
      | IApiGetLicenseKeyByIdSuccessResponse
      | IApiGetLicenseKeyByIdErrorResponse;
  }

  static async createLicenseKey(
    token: string,
    data: ICreateLicenseKeyRequest
  ): Promise<
    IApiCreateLicenseKeySuccessResponse | IApiCreateLicenseKeyErrorResponse
  > {
    try {
      const response = await axios.post(
        `${ENV.EXTERNAL_API_URL}/license-keys`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data as
        | IApiCreateLicenseKeySuccessResponse
        | IApiCreateLicenseKeyErrorResponse;
    } catch (error) {
      return {
        success: false,
        error: error as string,
      } as IApiCreateLicenseKeyErrorResponse;
    }
  }

  // Generate License Keys
  static async generateLicenseKeys(
    token: string,
    data: IGenerateLicenseKeysRequest
  ): Promise<string[]> {
    try {
      const response = await axios.post(
        `${ENV.EXTERNAL_API_URL}/license-keys/generate/batch`,
        JSON.stringify(data),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data as string[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Generate license keys error:', error);
      throw error;
    }
  }

  static async updateLicenseKey(
    token: string,
    id: string,
    data: IUpdateLicenseKeyRequest
  ): Promise<
    IApiUpdateLicenseKeySuccessResponse | IApiUpdateLicenseKeyErrorResponse
  > {
    const response = await axios.patch(
      `${ENV.EXTERNAL_API_URL}/license-keys/${id}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data as
      | IApiUpdateLicenseKeySuccessResponse
      | IApiUpdateLicenseKeyErrorResponse;
  }

  static async deleteLicenseKey(token: string, id: string): Promise<void> {
    await axios.delete(`${ENV.EXTERNAL_API_URL}/license-keys/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  //LICENSE
  // License Upgrade
  static async upgradeLicense(
    token: string,
    data: IUpgradeLicenseRequest
  ): Promise<
    IApiUpgradeLicenseErrorResponse | IApiUpgradeLicenseSuccessResponse
  > {
    const response = await axios.post(
      `${ENV.EXTERNAL_API_URL}/licenses/upgrade`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data as
      | IApiUpgradeLicenseErrorResponse
      | IApiUpgradeLicenseSuccessResponse;
  }

  static async validateLicense(
    token: string,
    data: ILicensePayload
  ): Promise<
    IApiValidateLicenseSuccessResponse | IApiValidateLicenseErrorResponse
  > {
    const response = await axios.post(
      `${ENV.EXTERNAL_API_URL}/licenses/validate`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data as
      | IApiValidateLicenseSuccessResponse
      | IApiValidateLicenseErrorResponse;
  }

  static async activateLicense(
    token: string,
    data: ILicensePayload
  ): Promise<
    IApiActivateLicenseSuccessResponse | IApiActivateLicenseErrorResponse
  > {
    const response = await axios.post(
      `${ENV.EXTERNAL_API_URL}/licenses/activate`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data as
      | IApiActivateLicenseSuccessResponse
      | IApiActivateLicenseErrorResponse;
  }
}
