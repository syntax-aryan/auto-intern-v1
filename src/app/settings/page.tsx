"use client";

import { useEffect, useState } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import SettingsEmailIntegrations from "@/components/settings-email-integrations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { createClient } from "../../../supabase/client";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/sign-in");
        return;
      }
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/sign-in");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <h1 className="text-4xl font-bold">Settings</h1>
            <p className="text-gray-400">
              Manage your account settings and integrations
            </p>
          </header>

          {/* Settings Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Email Integrations */}
            <SettingsEmailIntegrations />

            {/* Account Settings Placeholder */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Account Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your account preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Account settings coming soon...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
