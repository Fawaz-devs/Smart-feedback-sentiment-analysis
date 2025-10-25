import { supabase } from "../integrations/supabase/client";

/**
 * Utility functions to debug and fix authentication issues
 */

// Check if a user exists
export const checkUserExists = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error checking user:', error.message);
      return { exists: false, error: error.message };
    }

    return { exists: !!data, user: data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { exists: false, error: 'Unexpected error occurred' };
  }
};

// Check user's role
export const checkUserRole = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error checking user role:', error.message);
      return { role: null, error: error.message };
    }

    return { role: data.role, data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { role: null, error: 'Unexpected error occurred' };
  }
};

// Assign admin role to user
export const assignAdminRole = async (userId: string) => {
  try {
    // First check if user already has a role
    const { data: existingRole, error: selectError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (selectError) {
      console.error('Error checking existing role:', selectError.message);
      return { success: false, error: selectError.message };
    }

    // If user already has admin role, return success
    if (existingRole) {
      return { success: true, message: 'User already has admin role' };
    }

    // Assign admin role
    const { data, error } = await supabase
      .from('user_roles')
      .insert([
        {
          user_id: userId,
          role: 'admin'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error assigning admin role:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: 'Unexpected error occurred' };
  }
};

// Create a new user (for testing purposes)
export const createTestUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Error creating user:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: 'Unexpected error occurred' };
  }
};