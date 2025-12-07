import { Request, Response, NextFunction } from 'express';
import { deepOptimizeImageUrls, deriveOptimizeOptionsFromRequest } from '@/utils/imageOptimizer';
import { ENV } from '../lib';

/**
 * Middleware tối ưu URL ảnh Cloudinary trong toàn bộ JSON response.
 * - Tự động thêm f_auto, q_auto và scale theo thiết bị (Client Hints/qs)
 * - Có thể bật/tắt và giới hạn qua biến môi trường
 */
export function imageOptimizeMiddleware(req: Request, res: Response, next: NextFunction) {
    if (ENV.IMAGE_OPTIMIZE_ENABLED === 'false') {
        return next();
    }

	const originalJson = res.json.bind(res);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsonOverride = (body?: any): Response => {
		try {
			if (!body) return originalJson(body);

            // Không tối ưu nếu controller đã định dạng { success, message, data }
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const unwrapData = (payload: any) => {
				if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
					return { ...payload, data: deepOptimizeImageUrls(payload.data, req, deriveOptimizeOptionsFromRequest(req)) };
				}
				return deepOptimizeImageUrls(payload, req, deriveOptimizeOptionsFromRequest(req));
			};

            const optimized = unwrapData(body);
			return originalJson(optimized);
		} catch {
			return originalJson(body);
		}
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(res as any).json = jsonOverride;

	return next();
}

export default imageOptimizeMiddleware;


