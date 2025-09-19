import { z } from 'zod'

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
})

export const idSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
})

// Order schemas
export const orderLineSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  quantityOrdered: z.coerce.number().positive('Quantity must be positive'),
  unitPrice: z.coerce.number().positive('Unit price must be positive').optional(),
  departmentId: z.string().uuid('Invalid department ID').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
})

export const createOrderSchema = z.object({
  supplierId: z.string().uuid('Invalid supplier ID'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  expectedDate: z.string().datetime('Invalid date format').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  lines: z.array(orderLineSchema).min(1, 'At least one order line is required'),
})

export const updateOrderSchema = z.object({
  status: z.enum(['REQUESTED', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  expectedDate: z.string().datetime('Invalid date format').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

// Item schemas
export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  barcode: z.string().max(50, 'Barcode too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  categoryId: z.string().uuid('Invalid category ID'),
  departmentId: z.string().uuid('Invalid department ID'),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required').max(20, 'Unit too long'),
  conversionFactor: z.coerce.number().positive('Conversion factor must be positive').default(1),
  minStock: z.coerce.number().min(0, 'Min stock cannot be negative').default(0),
  maxStock: z.coerce.number().min(0, 'Max stock cannot be negative').default(0),
  salesPrice: z.coerce.number().min(0, 'Sales price cannot be negative').optional(),
  requiresLotTracking: z.boolean().default(false),
  requiresExpiryTracking: z.boolean().default(false),
  hmsCode: z.string().max(20, 'HMS code too long').optional(),
  casNumber: z.string().max(20, 'CAS number too long').optional(),
  storageConditions: z.string().max(200, 'Storage conditions too long').optional(),
})

export const updateItemSchema = createItemSchema.partial()

// Supplier schemas
export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  organizationNumber: z.string().max(20, 'Organization number too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  website: z.string().url('Invalid URL format').optional(),
  address: z.string().max(500, 'Address too long').optional(),
  contactPerson: z.string().max(100, 'Contact person name too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  isActive: z.boolean().default(true),
})

export const updateSupplierSchema = createSupplierSchema.partial()

// Location schemas
export const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  code: z.string().min(1, 'Code is required').max(20, 'Code too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isActive: z.boolean().default(true),
})

export const updateLocationSchema = createLocationSchema.partial()

// Department schemas
export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  code: z.string().min(1, 'Code is required').max(20, 'Code too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isActive: z.boolean().default(true),
})

export const updateDepartmentSchema = createDepartmentSchema.partial()

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  isActive: z.boolean().default(true),
})

export const updateCategorySchema = createCategorySchema.partial()

// Receipt schemas
export const receiptLineSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  lotNumber: z.string().max(50, 'Lot number too long').optional(),
  expiryDate: z.string().datetime('Invalid expiry date format').optional(),
  locationId: z.string().uuid('Invalid location ID'),
  notes: z.string().max(500, 'Notes too long').optional(),
})

export const createReceiptSchema = z.object({
  purchaseOrderId: z.string().uuid('Invalid purchase order ID').optional(),
  supplierId: z.string().uuid('Invalid supplier ID').optional(),
  receivedBy: z.string().uuid('Invalid user ID').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  lines: z.array(receiptLineSchema).min(1, 'At least one receipt line is required'),
})

// Inventory schemas
export const inventoryConsumptionSchema = z.object({
  inventoryLotId: z.string().uuid('Invalid inventory lot ID'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  consumedBy: z.string().uuid('Invalid user ID'),
  departmentId: z.string().uuid('Invalid department ID').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
})

// Barcode schemas
export const createBarcodeSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required').max(50, 'Barcode too long'),
  isPrimary: z.boolean().default(false),
})

export const scanLookupSchema = z.object({
  code: z.string().min(1, 'Code is required'),
})

// Cycle counting schemas
export const createCountingSessionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  locationId: z.string().uuid('Invalid location ID').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  departmentId: z.string().uuid('Invalid department ID').optional(),
  plannedDate: z.string().datetime('Invalid planned date format'),
  isBlind: z.boolean().default(false),
  recountThresholdPercent: z.coerce.number().min(0).max(100).default(10),
  requireRecountAboveThreshold: z.boolean().default(true),
})

export const countingLineSchema = z.object({
  id: z.string().uuid('Invalid line ID').optional(),
  inventoryLotId: z.string().uuid('Invalid inventory lot ID').optional(),
  countedQuantity: z.coerce.number().min(0, 'Counted quantity cannot be negative'),
  notes: z.string().max(500, 'Notes too long').optional(),
  scannedGtin: z.string().max(50, 'GTIN too long').optional(),
  scannedLotNumber: z.string().max(50, 'Lot number too long').optional(),
  scannedExpiryDate: z.string().datetime('Invalid expiry date format').optional(),
  reasonCode: z.enum(['DAMAGED', 'EXPIRED', 'MISPLACED', 'COUNTING_ERROR', 'OTHER']).optional(),
})

export const updateCountingSessionSchema = z.object({
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED']).optional(),
  lines: z.array(countingLineSchema).optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

export const approveCountingSchema = z.object({
  adjustmentNotes: z.string().max(1000, 'Adjustment notes too long').optional(),
})

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Validation helper function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return { success: false, error: errorMessages }
    }
    return { success: false, error: 'Validation failed' }
  }
}
