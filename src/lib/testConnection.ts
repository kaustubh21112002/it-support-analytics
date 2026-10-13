import { supabase } from './supabase';

export interface DepartmentRecord {
  department_id: string | number;
  department_name: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  count?: number;
  departments?: DepartmentRecord[];
  error?: string;
}

/**
 * Temporary Supabase connection diagnostic test.
 * Queries ONLY `departments` selecting `department_id` and `department_name`.
 * Does not expose credentials, modify data, or alter existing services.
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('department_id, department_name')
      .order('department_id', { ascending: true });

    if (error) {
      return {
        success: false,
        message: 'Connection test failed: Supabase returned an error.',
        error: error.message
      };
    }

    if (!data) {
      return {
        success: false,
        message: 'Connection test failed: No data array returned from Supabase.'
      };
    }

    return {
      success: true,
      message: `Connection successful! Retrieved ${data.length} department records.`,
      count: data.length,
      departments: data as DepartmentRecord[]
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: 'Connection test failed: An unexpected exception occurred.',
      error: errorMessage
    };
  }
}
