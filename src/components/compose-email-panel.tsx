"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Send,
  Loader2,
  Paperclip,
  X,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useToast } from "./ui/use-toast";
import { createClient } from "../../supabase/client";

interface GoogleAccount {
  id: string;
  google_email: string;
  needs_reauth: boolean;
}

interface Attachment {
  filename: string;
  mimeType: string;
  base64: string;
  size: number;
}

interface EmailResult {
  status: string;
  messageId: string;
  threadId: string;
  gmailUrl: string;
}

export default function ComposeEmailPanel() {
  const [googleAccount, setGoogleAccount] = useState<GoogleAccount | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState<EmailResult | null>(null);
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        // 20MB limit
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than 20MB and cannot be attached`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(",")[1]; // Remove data:mime;base64, prefix

        const attachment: Attachment = {
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          base64: base64Data,
          size: file.size,
        };

        setAttachments((prev) => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    event.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const parseEmailAddresses = (input: string): string[] => {
    return input
      .split(/[,;]/) // Split by comma or semicolon
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSend = async () => {
    if (!googleAccount) {
      toast({
        title: "Gmail Not Connected",
        description: "Please connect your Gmail account first",
        variant: "destructive",
      });
      return;
    }

    if (googleAccount.needs_reauth) {
      toast({
        title: "Gmail Needs Reconnection",
        description: "Please reconnect your Gmail account in settings",
        variant: "destructive",
      });
      return;
    }

    if (!to.trim() || !subject.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in the To field and Subject",
        variant: "destructive",
      });
      return;
    }

    const toAddresses = parseEmailAddresses(to);
    const ccAddresses = cc.trim() ? parseEmailAddresses(cc) : [];
    const bccAddresses = bcc.trim() ? parseEmailAddresses(bcc) : [];

    // Validate email addresses
    const allAddresses = [...toAddresses, ...ccAddresses, ...bccAddresses];
    const invalidEmails = allAddresses.filter((email) => !validateEmail(email));

    if (invalidEmails.length > 0) {
      toast({
        title: "Invalid Email Addresses",
        description: `Please check: ${invalidEmails.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    if (!bodyText.trim() && !bodyHtml.trim()) {
      toast({
        title: "Empty Email Body",
        description: "Please add some content to your email",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const emailData = {
        to: toAddresses,
        cc: ccAddresses.length > 0 ? ccAddresses : undefined,
        bcc: bccAddresses.length > 0 ? bccAddresses : undefined,
        subject,
        bodyText: bodyText.trim() || undefined,
        bodyHtml: bodyHtml.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (response.ok) {
        setLastSentEmail(result);

        // Clear form
        setTo("");
        setCc("");
        setBcc("");
        setSubject("");
        setBodyText("");
        setBodyHtml("");
        setAttachments([]);
        setShowCcBcc(false);

        toast({
          title: "Email Sent Successfully!",
          description: `Sent to ${toAddresses.join(", ")}`,
        });
      } else {
        toast({
          title: "Failed to Send Email",
          description:
            result.error || "An error occurred while sending the email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to Send Email",
        description: "An error occurred while sending the email",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Compose Email</CardTitle>
          <CardDescription className="text-gray-400">
            Send emails directly from your Gmail account
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

  if (!googleAccount) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Compose Email</CardTitle>
          <CardDescription className="text-gray-400">
            Send emails directly from your Gmail account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertCircle className="w-12 h-12 text-gray-400" />
            <div className="text-center">
              <p className="text-white font-medium">Gmail Not Connected</p>
              <p className="text-gray-400 text-sm">
                Connect your Gmail account in settings to send emails
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (googleAccount.needs_reauth) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Compose Email</CardTitle>
          <CardDescription className="text-gray-400">
            Send emails directly from your Gmail account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertCircle className="w-12 h-12 text-yellow-500" />
            <div className="text-center">
              <p className="text-white font-medium">Gmail Needs Reconnection</p>
              <p className="text-gray-400 text-sm">
                Please reconnect your Gmail account in settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Compose Email</CardTitle>
          <CardDescription className="text-gray-400">
            Sending from: {googleAccount.google_email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white">To *</Label>
            <Input
              className="bg-gray-800 border-gray-700 text-white mt-1"
              placeholder="recipient@example.com, another@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          {!showCcBcc && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCcBcc(true)}
              className="text-gray-400 hover:text-white p-0 h-auto"
            >
              + Add CC/BCC
            </Button>
          )}

          {showCcBcc && (
            <>
              <div>
                <Label className="text-white">CC</Label>
                <Input
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                  placeholder="cc@example.com"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-white">BCC</Label>
                <Input
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                  placeholder="bcc@example.com"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <Label className="text-white">Subject *</Label>
            <Input
              className="bg-gray-800 border-gray-700 text-white mt-1"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-white">Message *</Label>
            <Textarea
              className="bg-gray-800 border-gray-700 text-white mt-1 min-h-[200px]"
              placeholder="Write your email message here..."
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-white">Attachments</Label>
            <div className="mt-2">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept="*/*"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Add Attachments
              </Button>
            </div>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      <span className="text-white text-sm">
                        {attachment.filename}
                      </span>
                      <span className="text-gray-400 text-xs">
                        ({formatFileSize(attachment.size)})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="text-gray-400 hover:text-white p-1 h-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || !to.trim() || !subject.trim()}
            className="w-full bg-green-600 text-white hover:bg-green-700"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 w-4 h-4" />
                Send Email
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {lastSentEmail && (
        <Card className="bg-green-900/20 border-green-800">
          <CardHeader>
            <CardTitle className="text-green-400 text-lg">
              Email Sent Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                <strong>Message ID:</strong> {lastSentEmail.messageId}
              </p>
              <p className="text-gray-300">
                <strong>Thread ID:</strong> {lastSentEmail.threadId}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(lastSentEmail.gmailUrl, "_blank")}
                className="border-green-600 text-green-400 hover:bg-green-800/20"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View in Gmail
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
