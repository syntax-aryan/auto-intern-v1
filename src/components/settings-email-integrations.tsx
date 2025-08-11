"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Mail, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { createClient } from "../../supabase/client";

interface GoogleAccount {
  id: string;
  google_email: string;
  needs_reauth: boolean;
  created_at: string;
}

export default function SettingsEmailIntegrations() {
  const [googleAccount, setGoogleAccount] = useState<GoogleAccount | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchGoogleAccount();
  }, []);

  const fetchGoogleAccount = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_google_accounts")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setGoogleAccount(data);
      }
    } catch (error) {
      console.error("Error fetching Google account:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch("/api/integrations/google/start", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Failed to start Gmail connection",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Gmail",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!googleAccount) return;

    setDisconnecting(true);
    try {
      const { error } = await supabase
        .from("user_google_accounts")
        .delete()
        .eq("id", googleAccount.id);

      if (error) {
        toast({
          title: "Disconnection Failed",
          description: "Failed to disconnect Gmail account",
          variant: "destructive",
        });
      } else {
        setGoogleAccount(null);
        toast({
          title: "Gmail Disconnected",
          description: "Your Gmail account has been disconnected",
        });
      }
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect Gmail account",
        variant: "destructive",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Integrations
          </CardTitle>
          <CardDescription className="text-gray-400">
            Connect your email accounts to send emails directly from the
            dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Integrations
        </CardTitle>
        <CardDescription className="text-gray-400">
          Connect your email accounts to send emails directly from the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <h3 className="text-white font-medium">Gmail</h3>
                {googleAccount ? (
                  <div className="flex items-center gap-2">
                    {googleAccount.needs_reauth ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-500 text-sm">
                          Needs reconnection
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-500 text-sm">
                          Connected as {googleAccount.google_email}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Not connected</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {googleAccount ? (
                <>
                  {googleAccount.needs_reauth && (
                    <Button
                      onClick={handleConnect}
                      disabled={connecting}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      {connecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Reconnecting...
                        </>
                      ) : (
                        "Reconnect"
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    {disconnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Disconnecting...
                      </>
                    ) : (
                      "Disconnect"
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  size="sm"
                  className="bg-white text-black hover:bg-gray-200"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>
            • Gmail integration allows you to send emails using your own Gmail
            account
          </p>
          <p>
            • We only request permission to send emails, not read your inbox
          </p>
          <p>• Your Gmail credentials are securely encrypted and stored</p>
        </div>
      </CardContent>
    </Card>
  );
}
