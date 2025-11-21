/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to slug
 * @returns A URL-friendly slug
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generate a unique slug by appending a number if needed
 * @param baseSlug - The base slug
 * @param checkExists - Function to check if slug exists
 * @returns A unique slug
 */
export const generateUniqueSlug = async (
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Validate if a string is a valid slug format
 * @param slug - The slug to validate
 * @returns True if valid slug format
 */
export const isValidSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
};

export const parseExpiresIn = (expiresIn: string): number => {
  if (!expiresIn || typeof expiresIn !== 'string') {
    return 30 * 60 * 1000; // default 30 phút
  }

  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match || match[1] === undefined || match[2] === undefined) {
    return 15 * 60 * 1000;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (isNaN(value)) {
    return 15 * 60 * 1000;
  }

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 15 * 60 * 1000;
  }
};