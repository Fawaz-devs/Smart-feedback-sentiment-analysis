import { supabase } from "../integrations/supabase/client";

/**
 * Utility functions to check Supabase health and database status
 */

// Check if Supabase is accessible
export const checkSupabaseHealth = async () => {
  try {
    // Test basic connection
    const { data, error } = await supabase.rpc('now');

    if (error) {
      return { healthy: false, error: error.message };
    }

    return { healthy: true, data };
  } catch (err) {
    return { healthy: false, error: 'Failed to connect to Supabase' };
  }
};

// Check if required tables exist
export const checkRequiredTables = async () => {
  try {
    // Check user_roles table
    const userRolesCheck = await supabase
      .from('user_roles')
      .select('id')
      .limit(1);

    // Check profiles table
    const profilesCheck = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    // Check feedback table
    const feedbackCheck = await supabase
      .from('feedback')
      .select('id')
      .limit(1);

    const tables = {
      user_roles: !userRolesCheck.error,
      profiles: !profilesCheck.error,
      feedback: !feedbackCheck.error
    };

    const allExist = Object.values(tables).every(Boolean);

    return {
      allExist,
      tables,
      errors: {
        user_roles: userRolesCheck.error?.message,
        profiles: profilesCheck.error?.message,
        feedback: feedbackCheck.error?.message
      }
    };
  } catch (err) {
    return {
      allExist: false,
      tables: { user_roles: false, profiles: false, feedback: false },
      error: 'Failed to check tables'
    };
  }
};

// Get database status summary
export const getDatabaseStatus = async () => {
  try {
    const health = await checkSupabaseHealth();
    if (!health.healthy) {
      return { status: 'unhealthy', health, tables: null };
    }

    const tables = await checkRequiredTables();
    const status = tables.allExist ? 'ready' : 'incomplete';

    return { status, health, tables };
  } catch (err) {
    return { status: 'error', error: err };
  }
};