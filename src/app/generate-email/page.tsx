"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileText, Linkedin, Loader2, Send, RefreshCw } from "lucide-react";
import { createClient } from "../../../supabase/client";
import DashboardNavbar from "@/components/dashboard-navbar";
import { SubscriptionCheck } from "@/components/subscription-check";

interface EmailData {
  inputType: "resume" | "linkedin" | "";
  inputContent: string | File | null;
  targetCompany: string;
  position: string;
  generatedEmail: string;
}

export default function GenerateEmailPage() {
  const [data, setData] = useState<EmailData>({
    inputType: "",
    inputContent: null,
    targetCompany: "",
    position: "",
    generatedEmail: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGenerateEmail = async () => {
    if (!data.inputContent || !data.targetCompany || !data.position) {
      setError("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      let resumeText = "";
      if (data.inputType === "resume" && data.inputContent instanceof File) {
        resumeText = await (data.inputContent as File).text();
      } else {
        resumeText = data.inputContent as string;
      }

      const response = await fetch("/api/generate-smart-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputType: data.inputType,
          inputContent: resumeText,
          targetCompany: data.targetCompany,
          position: data.position,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate email");
      }

      setData({ ...data, generatedEmail: result.email });
    } catch (error) {
      console.error("Error generating email:", error);
      setError(
        error instanceof Error ? error.message : "Failed to generate email",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!data.generatedEmail) {
      setError("Please generate an email first");
      return;
    }

    setIsSending(true);
    setError("");

    try {
      // Here you would implement the actual email sending logic
      // For now, we'll just simulate it
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirect to dashboard with success message
      router.push("/dashboard?success=Email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
      setError("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SubscriptionCheck>
      <div className="min-h-screen bg-black text-white">
        <DashboardNavbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Generate Smart Email</h1>
              <p className="text-gray-400 text-lg">
                Create personalized cold emails using AI-powered analysis
              </p>
            </div>

            {/* Input Section */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">
                  Input Your Information
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Provide your resume or LinkedIn profile for personalized email
                  generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Input Type Selection */}
                <div className="space-y-2">
                  <Label className="text-white">Information Source</Label>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => setData({ ...data, inputType: "resume" })}
                      className={`flex-1 ${data.inputType === "resume" ? "bg-white text-black" : "border-gray-600 text-white hover:bg-gray-800"}`}
                    >
                      <FileText className="mr-2 w-4 h-4" />
                      Resume Text
                    </Button>
                    <Button
                      onClick={() => setData({ ...data, inputType: "linkedin" })}
                      className={`flex-1 ${data.inputType === "linkedin" ? "bg-white text-black" : "border-gray-600 text-white hover:bg-gray-800"}`}
                    >
                      <Linkedin className="mr-2 w-4 h-4" />
                      LinkedIn URL
                    </Button>
                  </div>
                </div>

                {/* Input Content */}
                {data.inputType === "resume" && (
                  <div className="space-y-2">
                    <Label className="text-white">Resume File</Label>
                    <Input
                      type="file"
                      className="bg-gray-800 border-gray-700 text-white"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setData({ ...data, inputContent: file });
                      }}
                    />
                    {data.inputContent instanceof File && (
                      <p className="text-sm text-gray-400">
                        Selected file: {(data.inputContent as File).name}
                      </p>
                    )}
                  </div>
                )}

                {data.inputType === "linkedin" && (
                  <div className="space-y-2">
                    <Label className="text-white">LinkedIn Profile URL</Label>
                    <Input
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={typeof data.inputContent === 'string' ? data.inputContent : ''}
                      onChange={(e) =>
                        setData({ ...data, inputContent: e.target.value })
                      }
                    />
                  </div>
                )}

                {/* Target Company */}
                <div className="space-y-2">
                  <Label className="text-white">Target Company</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="e.g., Google, Microsoft, Apple"
                    value={data.targetCompany}
                    onChange={(e) =>
                      setData({ ...data, targetCompany: e.target.value })
                    }
                  />
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <Label className="text-white">Position/Role</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="e.g., Software Engineer Intern, Product Manager"
                    value={data.position}
                    onChange={(e) =>
                      setData({ ...data, position: e.target.value })
                    }
                  />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateEmail}
                  disabled={
                    isGenerating ||
                    !data.inputContent ||
                    !data.targetCompany ||
                    !data.position
                  }
                  className="w-full bg-white text-black hover:bg-gray-200"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Generating Email...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 w-4 h-4" />
                      Generate Email
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Email Section */}
            {data.generatedEmail && (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Generated Email</CardTitle>
                  <CardDescription className="text-gray-400">
                    Review and edit your personalized email before sending
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Subject Line</Label>
                    <Input
                      className="bg-gray-800 border-gray-700 text-white"
                      value={`${data.position} Application - [Your Name]`}
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Email Content</Label>
                    <Textarea
                      className="bg-gray-800 border-gray-700 text-white min-h-[300px]"
                      value={data.generatedEmail}
                      onChange={(e) =>
                        setData({ ...data, generatedEmail: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleGenerateEmail}
                      disabled={isGenerating}
                      className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
                    >
                      {isGenerating ? (
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 w-4 h-4" />
                      )}
                      Regenerate
                    </Button>

                    <Button
                      onClick={handleSendEmail}
                      disabled={isSending}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      {isSending ? (
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card className="bg-red-900/20 border-red-800">
                <CardContent className="pt-6">
                  <p className="text-red-400">{error}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SubscriptionCheck>
  );
}
