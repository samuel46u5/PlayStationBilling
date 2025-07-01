/**
 * Troubleshooting utilities for product management system
 * These functions help diagnose and fix issues with product operations
 */

import { supabase } from './supabase';

/**
 * Test database connectivity
 * @returns {Promise<boolean>} True if connection successful
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing database connection...');
    
    const { data, error } = await supabase
      .from('products')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database connection error:', error);
      throw error;
    }
    
    console.log('✅ Database connected successfully');
    return true;
  } catch (err) {
    console.error('💥 Connection test failed:', err);
    return false;
  }
};

/**
 * Check if a barcode already exists
 * @param {string} barcode The barcode to check
 * @param {string} excludeId Optional product ID to exclude from check (for updates)
 * @returns {Promise<boolean>} True if barcode is available (doesn't exist)
 */
export const checkBarcodeAvailability = async (barcode: string, excludeId?: string): Promise<boolean> => {
  if (!barcode) return true; // No barcode is fine
  
  try {
    let query = supabase
      .from('products')
      .select('id')
      .eq('barcode', barcode);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query.maybeSingle();
    
    if (error) throw error;
    return !data; // Return true if no existing product found
  } catch (error) {
    console.error('❌ Barcode check failed:', error);
    throw error;
  }
};

/**
 * Check if user has permission to perform an action
 * @param {string} table The table to check permissions for
 * @param {string} action The action to check (select, insert, update, delete)
 * @returns {Promise<boolean>} True if user has permission
 */
export const checkPermission = async (table: string, action: 'select' | 'insert' | 'update' | 'delete'): Promise<boolean> => {
  try {
    let result = false;
    
    switch (action) {
      case 'select':
        const { data: selectData, error: selectError } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        result = !selectError;
        break;
        
      case 'insert':
        // Create a test record with minimal required fields
        // This is just a permission check, we'll roll it back
        const { data: insertData, error: insertError } = await supabase.rpc(
          'test_insert_permission',
          { table_name: table }
        );
        result = !insertError;
        break;
        
      case 'update':
        const { data: updateData, error: updateError } = await supabase.rpc(
          'test_update_permission',
          { table_name: table }
        );
        result = !updateError;
        break;
        
      case 'delete':
        const { data: deleteData, error: deleteError } = await supabase.rpc(
          'test_delete_permission',
          { table_name: table }
        );
        result = !deleteError;
        break;
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Permission check failed for ${action} on ${table}:`, error);
    return false;
  }
};

/**
 * Verify database schema for products table
 * @returns {Promise<{valid: boolean, issues: string[]}>} Validation result
 */
export const verifyProductsSchema = async (): Promise<{valid: boolean, issues: string[]}> => {
  try {
    const issues: string[] = [];
    
    // Check table structure
    const { data: columns, error: columnsError } = await supabase.rpc(
      'get_table_columns',
      { table_name: 'products' }
    );
    
    if (columnsError) {
      issues.push(`Failed to get table columns: ${columnsError.message}`);
    } else {
      // Check required columns
      const requiredColumns = ['name', 'price', 'category', 'is_active'];
      for (const col of requiredColumns) {
        if (!columns.find((c: any) => c.column_name === col)) {
          issues.push(`Missing required column: ${col}`);
        }
      }
    }
    
    // Check constraints
    const { data: constraints, error: constraintsError } = await supabase.rpc(
      'get_table_constraints',
      { table_name: 'products' }
    );
    
    if (constraintsError) {
      issues.push(`Failed to get table constraints: ${constraintsError.message}`);
    }
    
    // Check RLS policies
    const { data: policies, error: policiesError } = await supabase.rpc(
      'get_table_policies',
      { table_name: 'products' }
    );
    
    if (policiesError) {
      issues.push(`Failed to get RLS policies: ${policiesError.message}`);
    } else if (policies.length === 0) {
      issues.push('No RLS policies found for products table');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  } catch (error: any) {
    return {
      valid: false,
      issues: [`Schema verification failed: ${error.message}`]
    };
  }
};

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param delay Initial delay in milliseconds
 * @returns Result of the function
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      console.log(`Attempt ${attempt} failed:`, error);
      lastError = error;
      
      // Don't wait on the last attempt
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff
        delay *= 2;
      }
    }
  }
  
  throw lastError;
};

/**
 * Comprehensive debug logger for product operations
 */
export const productDebugger = {
  init: (id?: string) => console.log(`🔍 Debugging product ${id || 'new'}`),
  form: (data: any) => console.log('📝 Form data:', data),
  validation: (isValid: boolean, errors?: any) => console.log(`✓ Validation: ${isValid ? 'Passed' : 'Failed'}`, errors || ''),
  request: (url: string, method: string, data: any) => console.log(`🌐 ${method} ${url}`, data),
  response: (status: number, data: any) => console.log(`📥 Response (${status}):`, data),
  error: (message: string, details?: any) => console.error(`❌ ERROR: ${message}`, details || ''),
  success: (message: string, data?: any) => console.log(`✅ SUCCESS: ${message}`, data || '')
};

/**
 * Generate a detailed error report for troubleshooting
 * @param error The error object
 * @param context Additional context information
 * @returns Formatted error report
 */
export const generateErrorReport = (error: any, context: Record<string, any> = {}): string => {
  const timestamp = new Date().toISOString();
  const errorCode = error.code || 'UNKNOWN';
  const errorMessage = error.message || 'Unknown error';
  const errorDetails = error.details || '';
  const errorHint = error.hint || '';
  const stack = error.stack || '';
  
  // Format the report
  return `
ERROR REPORT (${timestamp})
========================
Error: ${errorCode} - ${errorMessage}
${errorDetails ? `Details: ${errorDetails}` : ''}
${errorHint ? `Hint: ${errorHint}` : ''}

Context:
${Object.entries(context)
  .map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`)
  .join('\n')}

Stack Trace:
${stack}
========================
`;
};