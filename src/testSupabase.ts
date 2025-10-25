import { supabase } from "./integrations/supabase/client";

/**
 * Simple test script to verify Supabase connection
 */
const testSupabaseConnection = async () => {
  console.log("Testing Supabase connection...");

  try {
    // Test basic connection by fetching current timestamp
    const { data, error } = await supabase.rpc('now');

    if (error) {
      console.error("❌ Supabase connection error:", error);
      return false;
    }

    console.log("✅ Supabase connection successful!");
    console.log("Current timestamp:", data);
    return true;
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return false;
  }
};

// Run the test
testSupabaseConnection();

export default testSupabaseConnection;