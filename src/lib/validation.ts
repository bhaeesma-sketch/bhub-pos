import { z } from 'zod';

export const staffSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  pin: z.string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d{4}$/, 'PIN must contain only numbers'),
  role: z.enum(['owner', 'staff'], {
    errorMap: () => ({ message: 'Invalid role. Must be "owner" or "staff".' })
  }),
  is_active: z.boolean(),
});

export const barcodeSchema = z.string()
  .trim()
  .min(1, 'Barcode is required')
  .max(50, 'Barcode too long')
  .regex(/^[0-9A-Za-z\-]+$/, 'Invalid barcode format');

export const searchQuerySchema = z.string()
  .max(200, 'Search query too long');

export function sanitizeSearchQuery(query: string): string {
  return query.trim().substring(0, 200);
}
