import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/error";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "@/utils/responseFormatter";
import { MESSAGES } from "@/constants";
import { AuthApiService } from "@/services";
import { User } from "@/models";
import { ENV } from "@/lib";

// ====================== CORE LOGIC ======================
const performLogin = async (): Promise<string | null> => {
  try {
    const data = await AuthApiService.loginUser();
    if (!data.success || !data.data?.token) return null;

    const user = await User.findOne({ where: { email: ENV.EMAIL_API_URL } });
    if (user) {
      user.tokenApi = data.data.token;
      await user.save();
    }

    return data.data.token;
  } catch (error) {
    console.error("Login failed:", error);
    return null;
  }
};

const fetchTokenFromDB = async (): Promise<string | null> => {
  try {
    const user = await User.findOne({ where: { email: ENV.EMAIL_API_URL } });
    return user?.tokenApi ?? null;
  } catch (error) {
    console.error("Fetch token failed:", error);
    return null;
  }
};

// ====================== TOKEN MANAGER ======================
const ensureValidToken = async (): Promise<string> => {
  let token = await fetchTokenFromDB();

  if (token) {
    const test = await AuthApiService.getMe(token);
    if (test.success && test.data?.email === ENV.EMAIL_API_URL) return token;
  }

  token = await performLogin();
  if (!token) {
    throw new Error("UNABLE_TO_OBTAIN_VALID_TOKEN");
  }

  return token;
};

// ====================== CONTROLLERS ======================
export const loginUser = asyncHandler(async (_req: Request, res: Response) => {
  const token = await performLogin();
  if (!token) {
    return sendErrorResponse(res, MESSAGES.ERROR.AUTH.UNAUTHORIZED);
  }
  return sendSuccessResponse(res, { token }, "Login successful");
});

export const getTokenApi = asyncHandler(
  async (_req: Request, res: Response) => {
    const token = await fetchTokenFromDB();
    if (!token) {
      return sendErrorResponse(res, MESSAGES.ERROR.AUTH.UNAUTHORIZED);
    }
    return sendSuccessResponse(res, { token }, "Token retrieved");
  }
);

export const getLicenseKeys = asyncHandler(
  async (_req: Request, res: Response) => {
    try {
      const token = await ensureValidToken();
      const result = await AuthApiService.getLicenseKeys(token);

      if (!result.success) {
        throw new Error("API_RETURNED_ERROR_EVEN_WITH_FRESH_TOKEN");
      }

      return sendSuccessResponse(res, result.data, MESSAGES.SUCCESS.FETCHED);
    } catch (error) {
      return sendErrorResponse(res, MESSAGES.ERROR.AUTH.UNAUTHORIZED);
    }
  }
);

export const getLicenseKeyById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || id.trim() === "") {
      return sendErrorResponse(res, MESSAGES.ERROR.LINK.REQUIRED_ID);
    }

    try {
      const token = await ensureValidToken();
      const result = await AuthApiService.getLicenseKeyById(token, id);

      if (!result.success) {
        throw new Error("LICENSE_NOT_FOUND_OR_EXPIRED");
      }

      return sendSuccessResponse(res, result, MESSAGES.SUCCESS.FETCHED);
    } catch (error) {
      return sendErrorResponse(res, MESSAGES.ERROR.AUTH.UNAUTHORIZED);
    }
  }
);

export const createLicenseKey = asyncHandler(
  async (req: Request, res: Response) => {
    const { key, isActive, duration } = req.body;

    if (!key) {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_KEY);
    }
    if (typeof isActive !== "boolean") {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_IS_ACTIVE);
    }
    if (typeof duration !== "string") {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_DURATION);
    }

    try {
      const token = await ensureValidToken();
      const result = await AuthApiService.createLicenseKey(token, {
        key,
        isActive,
        duration,
      });

      if (!result.success) {
        throw new Error("API_RETURNED_ERROR_EVEN_WITH_FRESH_TOKEN");
      }

      return sendSuccessResponse(res, result, MESSAGES.SUCCESS.CREATED);
    } catch (error) {
      return sendErrorResponse(res, MESSAGES.ERROR.AUTH.UNAUTHORIZED);
    }
  }
);

export const generateLicenseKeys = asyncHandler(
  async (req: Request, res: Response) => {
    const { quantity, duration } = req.body;

    if (!quantity || typeof quantity !== "number") {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_QUANTITY);
    }
    if (!duration || typeof duration !== "string") {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_COUNT);
    }

    try {
      const token = await ensureValidToken();
      const result = await AuthApiService.generateLicenseKeys(token, {
        quantity,
        duration,
      });
      if (!result.success) {
        throw new Error("API_RETURNED_ERROR_EVEN_WITH_FRESH_TOKEN");
      }

      return sendSuccessResponse(res, result, MESSAGES.SUCCESS.CREATED);
    }
    catch (error) {
      return sendErrorResponse(res, MESSAGES.ERROR.AUTH.UNAUTHORIZED);
    }
  }
);


export const updateLicenseKey = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, key, isActive, duration } = req.body;
    if (!id || id.trim() === "") {
      return sendErrorResponse(res, MESSAGES.ERROR.LINK.REQUIRED_ID);
    }
    if (!key) {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_KEY);
    }
    if (typeof isActive !== "boolean") {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_IS_ACTIVE);
    }
    if (typeof duration !== "string") {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_DURATION);
    }
    try {
      const token = await ensureValidToken();
      const result = await AuthApiService.updateLicenseKey(token, id,{
        key,
        isActive,
        duration,
      });

      if (!result.success) {
        throw new Error("API_RETURNED_ERROR_EVEN_WITH_FRESH_TOKEN");
      }

      return sendSuccessResponse(res, result, MESSAGES.SUCCESS.UPDATED);
    }
    catch (error) {
      return sendErrorResponse(res, MESSAGES.ERROR.AUTH.UNAUTHORIZED);
    }
  }
);

export const deleteLicenseKey = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id || id.trim() === "") {
      return sendErrorResponse(res, MESSAGES.ERROR.LINK.REQUIRED_ID);
    }
    try {
      const token = await ensureValidToken();
      await AuthApiService.deleteLicenseKey(token, id);
    }
    catch (error) {
      return sendErrorResponse(res, MESSAGES.ERROR.AUTH.UNAUTHORIZED);
    }
  }
);

export const upgradeLicense = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, machineId, newLicenseKey } = req.body;
    if (!email) {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_EMAIL);
    }
    if (!machineId) {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_MACHINE_ID);
    }
    if (!newLicenseKey) {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_NEW_LICENSE_KEY);
  }
  try {
    const token = await ensureValidToken();
    const result = await AuthApiService.upgradeLicense(token, {
      email,
      machineId,
      newLicenseKey,
    });

    if (!result.success) {
      throw new Error("API_RETURNED_ERROR_EVEN_WITH_FRESH_TOKEN");
    }

    return sendSuccessResponse(res, result, MESSAGES.SUCCESS.UPGRADED);
  }
  catch (error) {
    return sendErrorResponse(res, MESSAGES.ERROR.AUTH.UNAUTHORIZED);
  }
});

export const validateLicense = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, machineId, licenseKey } = req.body;
    if (!email) {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_EMAIL);
    }
    if (!machineId) {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_MACHINE_ID);
    }
    try {
      const token = await ensureValidToken();
      const result = await AuthApiService.validateLicense(token, {
        email,
        machineId,
        licenseKey,
      });

      if (!result.success) {
        throw new Error("API_RETURNED_ERROR_EVEN_WITH_FRESH_TOKEN");
      }

      return sendSuccessResponse(res, result, MESSAGES.SUCCESS.VALIDATED);
    }
    catch (error) {
      return sendErrorResponse(res, MESSAGES.ERROR.AUTH.UNAUTHORIZED);
    }
  }
);

export const activateLicense = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, machineId, licenseKey } = req.body;
    if (!email) {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_EMAIL);
    }
    if (!machineId) {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_MACHINE_ID);
    }
    if (!licenseKey) {
      return sendErrorResponse(res, MESSAGES.ERROR.LICENSE.REQUIRED_LICENSE_KEY);
    }
    try {
      const token = await ensureValidToken();
      const result = await AuthApiService.activateLicense(token, {
        email,
        machineId,
        licenseKey,
      });

      if (!result.success) {
        throw new Error("API_RETURNED_ERROR_EVEN_WITH_FRESH_TOKEN");
      }

      return sendSuccessResponse(res, result, MESSAGES.SUCCESS.ACTIVATED);
    }
    catch (error) {
      return sendErrorResponse(res, MESSAGES.ERROR.AUTH.UNAUTHORIZED);
    }
  }

);