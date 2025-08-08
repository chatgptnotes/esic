// @ts-nocheck
import { z } from 'zod';

// Utility validation functions
const sanitizeString = (str: string) => {
  // Remove potential XSS and injection patterns
  return str
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>]/g, '');
};

const phoneRegex = /^[+]?[\d\s\-()]{10,15}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const insuranceNumberRegex = /^[A-Z0-9\-\/]{8,20}$/;
const medicationNameRegex = /^[a-zA-Z0-9\s\-\.()\/]{1,200}$/;
const dosageRegex = /^[\d\.\s]+(mg|g|ml|mcg|IU|units?)\s*(daily|twice|thrice|q\d+h|PRN|as needed|morning|evening|night)?$/i;

// Custom transformers
const sanitizeTransform = z.string().transform(sanitizeString);
const uppercaseTransform = z.string().transform(str => str.toUpperCase().trim());

// Base validation schemas
export const baseValidation = {
  // Personal Information
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .regex(/^[a-zA-Z\s\-\.\']+$/, 'Name contains invalid characters')
    .transform(sanitizeString),

  age: z.number()
    .int('Age must be a whole number')
    .min(0, 'Age cannot be negative')
    .max(150, 'Age cannot exceed 150'),

  phone: z.string()
    .regex(phoneRegex, 'Invalid phone number format')
    .transform(sanitizeString),

  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .transform(str => str.toLowerCase().trim()),

  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address cannot exceed 500 characters')
    .transform(sanitizeString),

  // Medical identifiers
  patientId: z.string()
    .min(3, 'Patient ID too short')
    .max(50, 'Patient ID too long')
    .regex(/^[A-Z0-9\-]+$/, 'Patient ID contains invalid characters')
    .transform(uppercaseTransform),

  insuranceNumber: z.string()
    .regex(insuranceNumberRegex, 'Invalid insurance number format')
    .transform(uppercaseTransform),

  // Medical data
  diagnosis: z.string()
    .min(3, 'Diagnosis must be at least 3 characters')
    .max(500, 'Diagnosis cannot exceed 500 characters')
    .transform(sanitizeString),

  medication: z.string()
    .regex(medicationNameRegex, 'Invalid medication name')
    .max(200, 'Medication name too long')
    .transform(sanitizeString),

  dosage: z.string()
    .regex(dosageRegex, 'Invalid dosage format')
    .max(100, 'Dosage description too long')
    .transform(sanitizeString),

  // Dates
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(dateStr => {
      const date = new Date(dateStr);
      return date instanceof Date && !isNaN(date.getTime());
    }, 'Invalid date'),

  // Financial
  amount: z.number()
    .min(0, 'Amount cannot be negative')
    .max(1000000, 'Amount exceeds maximum limit')
    .multipleOf(0.01, 'Amount can have maximum 2 decimal places'),

  // Text fields
  notes: z.string()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .transform(sanitizeString)
    .optional(),

  // Status fields
  status: z.enum(['active', 'inactive', 'pending', 'completed', 'cancelled']),
};

// Patient Registration Schema
export const patientRegistrationSchema = z.object({
  name: baseValidation.name,
  age: baseValidation.age,
  gender: z.enum(['male', 'female', 'other']),
  phone: baseValidation.phone,
  email: baseValidation.email.optional(),
  address: baseValidation.address,
  emergency_contact: baseValidation.name,
  emergency_phone: baseValidation.phone,
  insurance_person_no: baseValidation.insuranceNumber.optional(),
  patient_type: z.enum(['ESIC', 'CGHS', 'Private', 'Emergency']),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: baseValidation.notes,
  medical_history: baseValidation.notes,
});

// Visit Registration Schema
export const visitRegistrationSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID'),
  visit_type: z.enum(['IPD', 'OPD', 'Emergency']),
  admission_date: baseValidation.date,
  discharge_date: baseValidation.date.optional(),
  primary_diagnosis: baseValidation.diagnosis.optional(),
  secondary_diagnosis: baseValidation.diagnosis.optional(),
  chief_complaint: z.string()
    .min(5, 'Chief complaint must be at least 5 characters')
    .max(1000, 'Chief complaint too long')
    .transform(sanitizeString),
  doctor_name: baseValidation.name,
  department: z.string()
    .min(2, 'Department name too short')
    .max(100, 'Department name too long')
    .transform(sanitizeString),
  room_number: z.string()
    .max(20, 'Room number too long')
    .regex(/^[A-Z0-9\-]+$/i, 'Invalid room number format')
    .transform(uppercaseTransform)
    .optional(),
});

// Medical Data Schema
export const medicalDataSchema = z.object({
  visit_id: z.string().uuid('Invalid visit ID'),
  primary_diagnosis: baseValidation.diagnosis.optional(),
  secondary_diagnosis: baseValidation.diagnosis.optional(),
  complications: z.array(baseValidation.diagnosis).optional(),
  procedures: z.array(z.string().max(300).transform(sanitizeString)).optional(),
  medications: z.array(z.object({
    name: baseValidation.medication,
    dosage: baseValidation.dosage,
    frequency: z.string().max(50).transform(sanitizeString),
    duration: z.string().max(50).transform(sanitizeString),
    instructions: baseValidation.notes,
  })).optional(),
  lab_orders: z.array(z.string().max(200).transform(sanitizeString)).optional(),
  radiology_orders: z.array(z.string().max(200).transform(sanitizeString)).optional(),
  vital_signs: z.object({
    temperature: z.number().min(90).max(110).optional(),
    blood_pressure_systolic: z.number().min(60).max(250).optional(),
    blood_pressure_diastolic: z.number().min(40).max(150).optional(),
    heart_rate: z.number().min(30).max(200).optional(),
    respiratory_rate: z.number().min(8).max(40).optional(),
    oxygen_saturation: z.number().min(70).max(100).optional(),
  }).optional(),
  notes: baseValidation.notes,
});

// Surgery Schema
export const surgerySchema = z.object({
  visit_id: z.string().uuid('Invalid visit ID'),
  surgery_name: z.string()
    .min(3, 'Surgery name too short')
    .max(300, 'Surgery name too long')
    .transform(sanitizeString),
  surgery_code: z.string()
    .max(50, 'Surgery code too long')
    .regex(/^[A-Z0-9\-\.]+$/i, 'Invalid surgery code format')
    .transform(uppercaseTransform)
    .optional(),
  surgeon_name: baseValidation.name,
  assistant_surgeon: baseValidation.name.optional(),
  anesthesia_type: z.enum(['General', 'Spinal', 'Local', 'Regional']).optional(),
  surgery_date: baseValidation.date,
  duration_minutes: z.number().min(1).max(1440).optional(), // Max 24 hours
  pre_op_notes: baseValidation.notes,
  post_op_notes: baseValidation.notes,
  complications: baseValidation.notes,
  sanction_status: z.enum(['Pending', 'Approved', 'Rejected', 'Under Review']),
});

// Billing Schema
export const billingSchema = z.object({
  visit_id: z.string().uuid('Invalid visit ID'),
  bill_number: z.string()
    .min(3, 'Bill number too short')
    .max(50, 'Bill number too long')
    .regex(/^[A-Z0-9\-\/]+$/i, 'Invalid bill number format')
    .transform(uppercaseTransform),
  bill_date: baseValidation.date,
  items: z.array(z.object({
    description: z.string().min(1).max(300).transform(sanitizeString),
    quantity: z.number().min(0.01).max(10000),
    unit_price: baseValidation.amount,
    total_price: baseValidation.amount,
    category: z.enum(['Consultation', 'Investigation', 'Procedure', 'Medication', 'Room', 'Other']),
  })).min(1, 'At least one billing item is required'),
  subtotal: baseValidation.amount,
  tax_amount: baseValidation.amount.optional(),
  discount_amount: baseValidation.amount.optional(),
  total_amount: baseValidation.amount,
  payment_status: z.enum(['Pending', 'Partial', 'Paid', 'Refunded']),
  payment_method: z.enum(['Cash', 'Card', 'Insurance', 'Online', 'Cheque']).optional(),
});

// User Authentication Schema (for form validation)
export const userAuthSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscore, and hyphen')
    .transform(str => str.toLowerCase().trim()),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
});

// Search Query Schema
export const searchQuerySchema = z.object({
  query: z.string()
    .min(1, 'Search query cannot be empty')
    .max(200, 'Search query too long')
    .transform(sanitizeString),
  filters: z.object({
    date_from: baseValidation.date.optional(),
    date_to: baseValidation.date.optional(),
    department: z.string().max(100).transform(sanitizeString).optional(),
    status: baseValidation.status.optional(),
  }).optional(),
  limit: z.number().min(1).max(1000).default(50),
  offset: z.number().min(0).default(0),
});

// Export validation helper functions
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
};

export const validateAndSanitize = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.parse(data);
  return result;
};

// Type exports for use in components
export type PatientRegistrationData = z.infer<typeof patientRegistrationSchema>;
export type VisitRegistrationData = z.infer<typeof visitRegistrationSchema>;
export type MedicalData = z.infer<typeof medicalDataSchema>;
export type SurgeryData = z.infer<typeof surgerySchema>;
export type BillingData = z.infer<typeof billingSchema>;
export type UserAuthData = z.infer<typeof userAuthSchema>;
export type SearchQueryData = z.infer<typeof searchQuerySchema>;