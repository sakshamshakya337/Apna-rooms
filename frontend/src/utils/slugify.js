/**
 * Generates an SEO-friendly URL slug from PG name, address, and city
 * @param {string} name 
 * @param {string} address 
 * @param {string} city 
 * @returns {string}
 */
export const slugifyPG = (name, address, city) => {
  const combined = `${name || ''} ${address || ''} ${city || ''}`;
  return combined
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/(^-|-$)+/g, '');    // Strip leading or trailing hyphens
};
