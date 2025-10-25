import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "../components/Glasscard";
import { Button } from "../components/ui/Button";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "../hooks/use-toast";
import { Loader2 } from "lucide-react";
import { checkDatabaseSchema, initializeDatabase, getMigrations } from "../utils/databaseSetup";
import { getDatabaseStatus } from "../utils/supabaseHealthCheck";

export default function DatabaseSetup() {
  const [loading, setLoading] = useState(false);
  const [schemaStatus, setSchemaStatus] = useState<{ exists: boolean, message?: string } | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<{ success: boolean, message?: string } | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check database status on page load
    handleCheckStatus();
  }, []);

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      const status = await getDatabaseStatus();
      setDbStatus(status);

      if (status.status === 'ready') {
        toast({
          title: "Database Ready",
          description: "All required tables are present."
        });
      } else if (status.status === 'incomplete') {
        toast({
          title: "Database Incomplete",
          description: "Some required tables are missing.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check database status.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSchema = async () => {
    setLoading(true);
    try {
      const result = await checkDatabaseSchema();
      setSchemaStatus(result);

      if (result.exists) {
        toast({
          title: "Success",
          description: "Database schema is properly configured."
        });
      } else {
        toast({
          title: "Schema Missing",
          description: "User roles table not found. Please run database migrations.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check database schema.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeDatabase = async () => {
    setLoading(true);
    try {
      const result = await initializeDatabase();

      if (result.success) {
        toast({
          title: "Success",
          description: result.message
        });
      } else {
        toast({
          title: "Initialization Failed",
          description: result.message || result.error,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize database.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunMigrations = async () => {
    setLoading(true);
    setMigrationStatus(null);

    try {
      const migrations = getMigrations();
      let successCount = 0;

      for (let i = 0; i < migrations.length; i++) {
        const migration = migrations[i];
        console.log(`Running migration ${i + 1}/${migrations.length}`);

        // Note: We can't directly execute SQL migrations from the frontend
        // This is just for demonstration. In a real scenario, you would need to
        // run these migrations using the Supabase CLI or dashboard
        console.log("Migration SQL:", migration);
        successCount++;
      }

      setMigrationStatus({
        success: true,
        message: `Successfully processed ${successCount}/${migrations.length} migrations. Please run these migrations using the Supabase CLI or dashboard.`
      });

      toast({
        title: "Migration Info",
        description: `Processed ${successCount}/${migrations.length} migrations. Please run these migrations using the Supabase CLI or dashboard.`
      });
    } catch (error: any) {
      setMigrationStatus({
        success: false,
        message: error.message || "Failed to run migrations."
      });

      toast({
        title: "Migration Error",
        description: error.message || "Failed to run migrations.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>
      <GlassCard className="w-full max-w-2xl relative z-10 p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Database Setup
          </h1>
          <p className="text-muted-foreground">
            Check and initialize your database schema
          </p>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Database Status</h2>
            <p className="text-muted-foreground mb-4">
              Current status of your database connection and tables
            </p>

            {dbStatus && (
              <div className="mb-4 p-4 rounded-lg bg-card/50">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Connection:</span>
                  <span className={dbStatus.health?.healthy ? 'text-green-500' : 'text-red-500'}>
                    {dbStatus.health?.healthy ? '✅ Connected' : '❌ Disconnected'}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">Tables:</span>
                  <span className={dbStatus.status === 'ready' ? 'text-green-500' : 'text-red-500'}>
                    {dbStatus.status === 'ready' ? '✅ All Present' : '❌ Missing'}
                  </span>
                </div>

                {dbStatus.tables && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex justify-between text-sm">
                      <span>user_roles:</span>
                      <span className={dbStatus.tables.tables?.user_roles ? 'text-green-500' : 'text-red-500'}>
                        {dbStatus.tables.tables?.user_roles ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>profiles:</span>
                      <span className={dbStatus.tables.tables?.profiles ? 'text-green-500' : 'text-red-500'}>
                        {dbStatus.tables.tables?.profiles ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>feedback:</span>
                      <span className={dbStatus.tables.tables?.feedback ? 'text-green-500' : 'text-red-500'}>
                        {dbStatus.tables.tables?.feedback ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleCheckStatus}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Refresh Status
            </Button>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Schema Check</h2>
            <p className="text-muted-foreground mb-4">
              Verify that the required database tables exist
            </p>

            {schemaStatus && (
              <div className="mb-4 p-4 rounded-lg bg-card/50">
                <p className={`font-medium ${schemaStatus.exists ? 'text-green-500' : 'text-red-500'}`}>
                  {schemaStatus.exists ? '✅ Schema Found' : '❌ Schema Missing'}
                </p>
                {schemaStatus.message && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    {schemaStatus.message}
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={handleCheckSchema}
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check Database Schema
            </Button>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Run Migrations</h2>
            <p className="text-muted-foreground mb-4">
              Process database migrations to set up required tables
            </p>

            {migrationStatus && (
              <div className="mb-4 p-4 rounded-lg bg-card/50">
                <p className={`font-medium ${migrationStatus.success ? 'text-green-500' : 'text-red-500'}`}>
                  {migrationStatus.success ? '✅ Migrations Processed' : '❌ Migration Error'}
                </p>
                {migrationStatus.message && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    {migrationStatus.message}
                  </p>
                )}
              </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
              <p className="text-yellow-500 font-medium">Important</p>
              <p className="text-sm mt-1">
                The migrations have been prepared but need to be run using the Supabase CLI or dashboard.
                Click the button below to see the migration SQL.
              </p>
            </div>

            <Button
              onClick={handleRunMigrations}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Prepare Migrations
            </Button>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Manual Setup</h2>
            <p className="text-muted-foreground mb-4">
              If automatic setup fails, you can manually run the migrations
            </p>

            <div className="space-y-4">
              <div>
                <p className="font-medium">1. Install Supabase CLI</p>
                <pre className="text-sm bg-black/10 p-2 rounded mt-1 overflow-x-auto">
                  npm install -g supabase
                </pre>
              </div>

              <div>
                <p className="font-medium">2. Link your project</p>
                <pre className="text-sm bg-black/10 p-2 rounded mt-1 overflow-x-auto">
                  supabase link --project-ref uozoihhxkpzubzfzuckw
                </pre>
              </div>

              <div>
                <p className="font-medium">3. Run migrations</p>
                <pre className="text-sm bg-black/10 p-2 rounded mt-1 overflow-x-auto">
                  supabase db push
                </pre>
              </div>

              <div>
                <p className="font-medium">4. Or run migrations manually</p>
                <p className="text-sm mt-1 text-muted-foreground">
                  Copy and paste the migration SQL from the migrations files into the Supabase SQL editor:
                </p>
                <ul className="text-sm mt-2 list-disc list-inside text-muted-foreground">
                  <li><code>supabase/migrations/20251019042602_51261785-fc45-4231-a69f-71c7f2734414.sql</code></li>
                  <li><code>supabase/migrations/20251019042613_f098a819-7e62-4cad-b1dc-847677e497d3.sql</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/migration-helper")}
              className="text-muted-foreground hover:text-foreground"
            >
              Database Migration Helper
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            Back to Home
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}