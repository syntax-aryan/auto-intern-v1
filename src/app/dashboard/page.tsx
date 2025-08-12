"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import {
  Mail,
  BarChart3,
  Target,
  FileText,
  TrendingUp,
  Send,
  RefreshCw,
  Loader2,
  Edit,
  Save,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { createClient } from "../../../supabase/client";

interface OnboardingData {
  goal: string[];
  careerPath: string[];
  experience: string[];
  companies: string[];
  resumeData: string;
  linkedinUrl: string;
  dataType: "resume" | "linkedin" | "";
}

interface UserData {
  user: any;
  subscription: any;
  emailsUsed: number;
  emailLimit: number;
  emailsRemaining: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    goal: [],
    careerPath: [],
    experience: [],
    companies: [],
    resumeData: "",
    linkedinUrl: "",
    dataType: "",
  });
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [isEditingOnboarding, setIsEditingOnboarding] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isUpdatingOnboarding, setIsUpdatingOnboarding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push("/sign-in");
        return;
      }
      setIsAuthenticated(true);
      fetchUserData();
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/sign-in");
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/get-user-data");
      const data = await response.json();
      if (response.ok) {
        setUserData(data);
        if (data.user?.onboarding_data) {
          setOnboardingData(data.user.onboarding_data);
        }
      } else {
        setError(data.error || "Failed to fetch user data");
      }
    } catch (error) {
      setError("Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOnboarding = async () => {
    setIsUpdatingOnboarding(true);
    setError("");
    try {
      const response = await fetch("/api/update-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onboardingData),
      });
      const result = await response.json();
      if (response.ok) {
        setSuccess("Onboarding information updated successfully!");
        setIsEditingOnboarding(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Failed to update onboarding information");
      }
    } catch (error) {
      setError("Failed to update onboarding information");
    } finally {
      setIsUpdatingOnboarding(false);
    }
  };

  const handleGenerateEmail = async () => {
    if (!targetCompany) {
      setError("Please enter a target company");
      return;
    }
    setIsGeneratingEmail(true);
    setError("");

    try {
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: onboardingData.goal.join(", "),
          careerPath: onboardingData.careerPath.join(", "),
          experience: onboardingData.experience.join(", "),
          companies: targetCompany,
          resumeData:
            onboardingData.dataType === "resume"
              ? onboardingData.resumeData
              : onboardingData.linkedinUrl,
          dataType: onboardingData.dataType,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        setGeneratedEmail(result.email);
        setEmailSubject(
          `${onboardingData.goal.join("/")} Opportunity - [Your Name]`
        );
      } else {
        setError(result.error || "Failed to generate email");
      }
    } catch (error) {
      setError("Failed to generate email");
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleSendEmail = async () => {
    if (!generatedEmail || !recipientEmail || !emailSubject) {
      setError("Please fill in all email fields");
      return;
    }
    setIsSendingEmail(true);
    setError("");

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: generatedEmail,
          recipientEmail,
          subject: emailSubject,
          targetCompany,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message);
        setGeneratedEmail("");
        setRecipientEmail("");
        setEmailSubject("");
        setTargetCompany("");
        fetchUserData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Failed to send email");
      }
    } catch (error) {
      setError("Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleArraySelection = (
    field: keyof Pick<OnboardingData, "goal" | "careerPath" | "experience" | "companies">,
    value: string
  ) => {
    const currentArray = onboardingData[field];
    const isSelected = currentArray.includes(value);

    if (isSelected) {
      setOnboardingData({
        ...onboardingData,
        [field]: currentArray.filter((item) => item !== value),
      });
    } else if (currentArray.length < 3) {
      setOnboardingData({
        ...onboardingData,
        [field]: [...currentArray, value],
      });
    }
  };

  if (loading || !isAuthenticated) {
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
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="text-gray-400">
              Manage your cold email campaigns and track your progress
            </p>
          </header>

          {/* Success/Error Messages */}
          {success && (
            <Card className="bg-green-900/20 border-green-800">
              <CardContent className="pt-6">
                <p className="text-green-400">{success}</p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="bg-red-900/20 border-red-800">
              <CardContent className="pt-6">
                <p className="text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Emails Used
                </CardTitle>
                <Mail className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {userData?.emailsUsed || 0}
                </div>
                <p className="text-xs text-gray-400">This month</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Emails Remaining
                </CardTitle>
                <Target className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {userData?.emailsRemaining || 0}
                </div>
                <p className="text-xs text-gray-400">
                  Out of {userData?.emailLimit || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Current Plan
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white capitalize">
                  {userData?.subscription?.plan_name || "Free"}
                </div>
                <p className="text-xs text-gray-400">Active subscription</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Usage Rate
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {userData?.emailLimit
                    ? Math.round((userData.emailsUsed / userData.emailLimit) * 100)
                    : 0}
                  %
                </div>
                <p className="text-xs text-gray-400">Of monthly limit</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Onboarding Information */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Your Profile</CardTitle>
                  <CardDescription className="text-gray-400">
                    Update your onboarding information
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => setIsEditingOnboarding(!isEditingOnboarding)}
                >
                  {isEditingOnboarding ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                {isEditingOnboarding ? (
                  <div className="space-y-4">
                    {/* Goals */}
                    <div>
                      <Label className="text-white mb-2 block">Goals (up to 3)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Internships", "Jobs", "Research", "Referrals"].map((option) => {
                          const selected = onboardingData.goal.includes(option);
                          return (
                            <Button
                              key={option}
                              variant="outline"
                              size="sm"
                              className="text-xs bg-white text-black border-gray-600 hover:bg-gray-200"
                              onClick={() => handleArraySelection("goal", option)}
                              disabled={!selected && onboardingData.goal.length >= 3}
                            >
                              {option}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Career Path */}
                    <div>
                      <Label className="text-white mb-2 block">Career Path (up to 3)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Technology", "Finance", "Law", "Healthcare", "Marketing", "Consulting"].map(
                          (option) => {
                            const selected = onboardingData.careerPath.includes(option);
                            return (
                              <Button
                                key={option}
                                variant="outline"
                                size="sm"
                                className="text-xs bg-white text-black border-gray-600 hover:bg-gray-200"
                                onClick={() => handleArraySelection("careerPath", option)}
                                disabled={!selected && onboardingData.careerPath.length >= 3}
                              >
                                {option}
                              </Button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Experience */}
                    <div>
                      <Label className="text-white mb-2 block">Experience (up to 3)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Beginner", "Intermediate", "Expert"].map((option) => {
                          const selected = onboardingData.experience.includes(option);
                          return (
                            <Button
                              key={option}
                              variant="outline"
                              size="sm"
                              className="text-xs bg-white text-black border-gray-600 hover:bg-gray-200"
                              onClick={() => handleArraySelection("experience", option)}
                              disabled={!selected && onboardingData.experience.length >= 3}
                            >
                              {option}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Data Type */}
                    <div>
                      <Label className="text-white mb-2 block">Profile Data</Label>
                      <div className="flex gap-2 mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white text-black border-gray-600 hover:bg-gray-200"
                          onClick={() =>
                            setOnboardingData({ ...onboardingData, dataType: "resume" })
                          }
                        >
                          Resume
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white text-black border-gray-600 hover:bg-gray-200"
                          onClick={() =>
                            setOnboardingData({ ...onboardingData, dataType: "linkedin" })
                          }
                        >
                          LinkedIn
                        </Button>
                      </div>

                      {onboardingData.dataType === "resume" && (
                        <Textarea
                          className="bg-gray-800 border-gray-700 text-white"
                          placeholder="Paste your resume content here..."
                          value={onboardingData.resumeData}
                          onChange={(e) =>
                            setOnboardingData({ ...onboardingData, resumeData: e.target.value })
                          }
                        />
                      )}

                      {onboardingData.dataType === "linkedin" && (
                        <Input
                          className="bg-gray-800 border-gray-700 text-white"
                          placeholder="https://linkedin.com/in/yourprofile"
                          value={onboardingData.linkedinUrl}
                          onChange={(e) =>
                            setOnboardingData({ ...onboardingData, linkedinUrl: e.target.value })
                          }
                        />
                      )}
                    </div>

                    <Button
                      onClick={handleUpdateOnboarding}
                      disabled={isUpdatingOnboarding}
                      className="w-full bg-white text-black hover:bg-gray-200"
                    >
                      {isUpdatingOnboarding ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm">Goals:</p>
                      <p className="text-white">{onboardingData.goal.join(", ") || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Career Path:</p>
                      <p className="text-white">
                        {onboardingData.careerPath.join(", ") || "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Experience:</p>
                      <p className="text-white">
                        {onboardingData.experience.join(", ") || "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Profile Data:</p>
                      <p className="text-white capitalize">
                        {onboardingData.dataType || "Not set"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email Generation and Sending */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Email Generator</CardTitle>
                <CardDescription className="text-gray-400">
                  Generate and send personalized emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white">Target Company</Label>
                  <Input
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                    placeholder="e.g., Google, Microsoft, Apple"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleGenerateEmail}
                  disabled={isGeneratingEmail || !targetCompany}
                  className="w-full bg-white text-black hover:bg-gray-200"
                >
                  {isGeneratingEmail ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 w-4 h-4" />
                      Generate Email
                    </>
                  )}
                </Button>

                {generatedEmail && (
                  <div className="space-y-4 pt-4 border-t border-gray-700">
                    <div>
                      <Label className="text-white">Subject</Label>
                      <Input
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="text-white">Recipient Email</Label>
                      <Input
                        className="bg-gray-800 border-gray-700 text-white mt-1"
                        placeholder="recruiter@company.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="text-white">Email Content</Label>
                      <Textarea
                        className="bg-gray-800 border-gray-700 text-white mt-1 min-h-[200px]"
                        value={generatedEmail}
                        onChange={(e) => setGeneratedEmail(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handleSendEmail}
                      disabled={
                        isSendingEmail ||
                        !recipientEmail ||
                        !emailSubject ||
                        (userData?.emailsRemaining || 0) <= 0
                      }
                      className="w-full bg-green-600 text-white hover:bg-green-700"
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 w-4 h-4" />
                          Send Email ({userData?.emailsRemaining || 0} remaining)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-400">
                Access additional features and tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <Link href="/generate-email">
                  <Button className="w-full bg-gray-800 text-white hover:bg-gray-700 justify-start">
                    <Target className="mr-2 w-4 h-4" />
                    Advanced Email
                  </Button>
                </Link>

                <Link href="/resume-builder">
                  <Button className="w-full bg-gray-800 text-white hover:bg-gray-700 justify-start">
                    <FileText className="mr-2 w-4 h-4" />
                    Resume Builder
                  </Button>
                </Link>

                <Button className="w-full bg-gray-800 text-white hover:bg-gray-700 justify-start">
                  <BarChart3 className="mr-2 w-4 h-4" />
                  View Analytics
                </Button>

                <Link href="/pricing">
                  <Button className="w-full bg-gray-800 text-white hover:bg-gray-700 justify-start">
                    <TrendingUp className="mr-2 w-4 h-4" />
                    Upgrade Plan
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
