import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const TestSignIn = () => {
  useEffect(() => {
    const testSignIn = async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "your_email@example.com",
        password: "your_password",
      });
      if (error) console.error("Sign-in error:", error);
      else console.log("Sign-in data:", data);

      const session = supabase.auth.session();
      console.log("Current session:", session);
    };

    testSignIn();
  }, []);

  return null;
};

export default TestSignIn;
