// @ts-nocheck
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { validateAndSanitize } from '@/lib/validation';

// Database operation wrapper with validation
export class ValidatedDatabase {
  private static logOperation(operation: string, table: string, data?: unknown) {
    // In production, this should be replaced with proper logging service
    console.log(`[DB Operation] ${operation} on ${table}`, {
      timestamp: new Date().toISOString(),
      data: data ? Object.keys(data as object) : undefined
    });
  }

  // Validated insert operation
  static async insert<T>(
    table: string,
    data: unknown,
    schema: z.ZodSchema<T>
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      // Validate and sanitize input data
      const validatedData = validateAndSanitize(schema, data);
      
      this.logOperation('INSERT', table, validatedData);
      
      const { data: result, error } = await supabase
        .from(table)
        .insert(validatedData)
        .select()
        .single();

      if (error) {
        console.error(`[DB Error] Insert failed on ${table}:`, error);
        return { data: null, error: error.message };
      }

      return { data: result, error: null };
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessages = validationError.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        console.error(`[Validation Error] Insert on ${table}:`, errorMessages);
        return { data: null, error: `Validation failed: ${errorMessages}` };
      }
      console.error(`[Unknown Error] Insert on ${table}:`, validationError);
      return { data: null, error: 'Unknown validation error' };
    }
  }

  // Validated update operation
  static async update<T>(
    table: string,
    id: string,
    data: unknown,
    schema: z.ZodSchema<T>
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      // Validate ID
      const idSchema = z.string().uuid('Invalid ID format');
      const validatedId = validateAndSanitize(idSchema, id);
      
      // Validate and sanitize update data
      const validatedData = validateAndSanitize(schema, data);
      
      this.logOperation('UPDATE', table, { id: validatedId, ...validatedData });
      
      const { data: result, error } = await supabase
        .from(table)
        .update(validatedData)
        .eq('id', validatedId)
        .select()
        .single();

      if (error) {
        console.error(`[DB Error] Update failed on ${table}:`, error);
        return { data: null, error: error.message };
      }

      return { data: result, error: null };
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessages = validationError.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        console.error(`[Validation Error] Update on ${table}:`, errorMessages);
        return { data: null, error: `Validation failed: ${errorMessages}` };
      }
      console.error(`[Unknown Error] Update on ${table}:`, validationError);
      return { data: null, error: 'Unknown validation error' };
    }
  }

  // Validated search operation
  static async search(
    table: string,
    searchParams: unknown
  ): Promise<{ data: unknown[] | null; error: string | null }> {
    try {
      const { searchQuerySchema } = require('@/lib/validation');
      const validatedParams = validateAndSanitize(searchQuerySchema, searchParams);
      
      this.logOperation('SEARCH', table, validatedParams);
      
      let query = supabase.from(table).select('*');
      
      // Apply search filters safely
      if (validatedParams.query) {
        // This is a basic implementation - in production, implement proper full-text search
        query = query.or(`name.ilike.%${validatedParams.query}%,description.ilike.%${validatedParams.query}%`);
      }
      
      if (validatedParams.filters?.date_from) {
        query = query.gte('created_at', validatedParams.filters.date_from);
      }
      
      if (validatedParams.filters?.date_to) {
        query = query.lte('created_at', validatedParams.filters.date_to);
      }
      
      if (validatedParams.filters?.status) {
        query = query.eq('status', validatedParams.filters.status);
      }
      
      query = query
        .range(validatedParams.offset, validatedParams.offset + validatedParams.limit - 1)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error(`[DB Error] Search failed on ${table}:`, error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessages = validationError.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        console.error(`[Validation Error] Search on ${table}:`, errorMessages);
        return { data: null, error: `Search validation failed: ${errorMessages}` };
      }
      console.error(`[Unknown Error] Search on ${table}:`, validationError);
      return { data: null, error: 'Unknown search error' };
    }
  }

  // Safe delete operation (requires validation)
  static async delete(
    table: string,
    id: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Validate ID
      const idSchema = z.string().uuid('Invalid ID format');
      const validatedId = validateAndSanitize(idSchema, id);
      
      this.logOperation('DELETE', table, { id: validatedId });
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', validatedId);

      if (error) {
        console.error(`[DB Error] Delete failed on ${table}:`, error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessages = validationError.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        console.error(`[Validation Error] Delete on ${table}:`, errorMessages);
        return { success: false, error: `Delete validation failed: ${errorMessages}` };
      }
      console.error(`[Unknown Error] Delete on ${table}:`, validationError);
      return { success: false, error: 'Unknown delete error' };
    }
  }

  // Validated get by ID
  static async getById(
    table: string,
    id: string
  ): Promise<{ data: unknown | null; error: string | null }> {
    try {
      // Validate ID
      const idSchema = z.string().uuid('Invalid ID format');
      const validatedId = validateAndSanitize(idSchema, id);
      
      this.logOperation('GET_BY_ID', table, { id: validatedId });
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', validatedId)
        .single();

      if (error) {
        console.error(`[DB Error] Get by ID failed on ${table}:`, error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessages = validationError.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        console.error(`[Validation Error] Get by ID on ${table}:`, errorMessages);
        return { data: null, error: `ID validation failed: ${errorMessages}` };
      }
      console.error(`[Unknown Error] Get by ID on ${table}:`, validationError);
      return { data: null, error: 'Unknown error' };
    }
  }
}

// Convenience functions for common operations with healthcare schemas
export const insertPatient = (data: unknown) => {
  const { patientRegistrationSchema } = require('@/lib/validation');
  return ValidatedDatabase.insert('patients', data, patientRegistrationSchema);
};

export const insertVisit = (data: unknown) => {
  const { visitRegistrationSchema } = require('@/lib/validation');
  return ValidatedDatabase.insert('visits', data, visitRegistrationSchema);
};

export const insertMedicalData = (data: unknown) => {
  const { medicalDataSchema } = require('@/lib/validation');
  return ValidatedDatabase.insert('visit_medical_data', data, medicalDataSchema);
};

export const insertSurgery = (data: unknown) => {
  const { surgerySchema } = require('@/lib/validation');
  return ValidatedDatabase.insert('visit_surgeries', data, surgerySchema);
};

export const insertBilling = (data: unknown) => {
  const { billingSchema } = require('@/lib/validation');
  return ValidatedDatabase.insert('bills', data, billingSchema);
};

// Update functions
export const updatePatient = (id: string, data: unknown) => {
  const { patientRegistrationSchema } = require('@/lib/validation');
  return ValidatedDatabase.update('patients', id, data, patientRegistrationSchema.partial());
};

export const updateVisit = (id: string, data: unknown) => {
  const { visitRegistrationSchema } = require('@/lib/validation');
  return ValidatedDatabase.update('visits', id, data, visitRegistrationSchema.partial());
};

export const updateMedicalData = (id: string, data: unknown) => {
  const { medicalDataSchema } = require('@/lib/validation');
  return ValidatedDatabase.update('visit_medical_data', id, data, medicalDataSchema.partial());
};