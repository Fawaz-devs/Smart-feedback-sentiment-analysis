import { supabase } from "./integrations/supabase/client";

/**
 * Simple authentication test function
 */
export const testAuthConnection = async () => {
  console.log("🧪 Testing Supabase authentication connection...");
  
  try {
    // Test basic connection
    const { data, error } = await supabase.rpc('now');
    
    if (error) {
      console.error("❌ Supabase connection error:", error);
      return { success: false, error };
    }
    
    console.log("✅ Supabase connection successful!");
    console.log("🕐 Current timestamp:", data);
    
    // Test auth methods availability
    console.log("🔐 Supabase auth methods available:", !!supabase.auth);
    console.log("📝 Available auth methods:", Object.keys(supabase.auth || {}));
    
    return { success: true, data };
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return { success: false, error: err };
  }
};

// Run the test if in development mode
if (import.meta.env.DEV) {
  testAuthConnection();
}

export default testAuthConnection;