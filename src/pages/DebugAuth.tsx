import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import {
  checkUserExists,
  checkUserRole,
  assignAdminRole,
  createTestUser
} from "../utils/debugAuth";
import { GlassCard } from "../components/Glasscard";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/Button";
import { useToast } from "../hooks/use-toast";

const DebugAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCheckUser = async () => {
    setLoading(true);
    try {
      const result = await checkUserExists(email);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: result.exists ? "User Found" : "User Not Found",
          description: result.exists ? `User ID: ${result.user.id}` : "No user with this email exists"
        });
        if (result.exists && result.user) {
          setUserId(result.user.id);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckRole = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please enter a user ID or check a user first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await checkUserRole(userId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Role Check Complete",
          description: `User role: ${result.role || 'No role assigned'}`
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAdmin = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please enter a user ID or check a user first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await assignAdminRole(userId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Admin role assigned successfully!"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createTestUser(email, password);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "User created successfully! Please check your email for confirmation."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Signed in successfully!"
        });
        // Check if user is admin
        if (data.user) {
          const roleResult = await checkUserRole(data.user.id);
          if (roleResult.role === 'admin') {
            navigate('/admin-dashboard');
          } else {
            toast({
              title: "Access Info",
              description: "You are signed in but not as an admin."
            });
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <GlassCard className="w-full max-w-2xl relative z-10 p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Authentication Debugger
          </h1>
          <p className="text-muted-foreground">
            Tools to debug and fix authentication issues
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Creation */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Create Test User</h2>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
              />
            </div>
            <Button
              onClick={handleCreateUser}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Creating..." : "Create User"}
            </Button>
          </div>

          {/* Sign In */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Sign In</h2>
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
              />
            </div>
            <Button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </div>

          {/* User Check */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Check User</h2>
            <div className="space-y-2">
              <Label htmlFor="check-email">Email</Label>
              <Input
                id="check-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <Button
              onClick={handleCheckUser}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Checking..." : "Check User Exists"}
            </Button>
          </div>

          {/* Role Management */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Manage Roles</h2>
            <div className="space-y-2">
              <Label htmlFor="user-id">User ID</Label>
              <Input
                id="user-id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="User ID"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleCheckRole}
                disabled={loading}
              >
                {loading ? "Checking..." : "Check Role"}
              </Button>
              <Button
                onClick={handleAssignAdmin}
                disabled={loading}
                variant="secondary"
              >
                {loading ? "Assigning..." : "Make Admin"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Use these tools to debug authentication issues and manage user roles.</p>
          <p className="mt-2">Remember to remove this component from production!</p>
        </div>
      </GlassCard>
    </div>
  );
};

export default DebugAuth;