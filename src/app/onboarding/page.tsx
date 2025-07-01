"use client";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  Linkedin,
} from "lucide-react";
import { createClient } from "../../../supabase/client";

interface OnboardingData {
  goal: string[];
  careerPath: string[];
  experience: string[];
  companies: string[];
  resumeFile: File | null;
  linkedinUrl: string;
  dataType: "resume" | "linkedin" | "";
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    goal: [],
    careerPath: [],
    experience: [],
    companies: [],
    resumeFile: null,
    linkedinUrl: "",
    dataType: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleGenerateEmail = async () => {
    setIsLoading(true);
    try {
      let resumeText = "";
      if (data.dataType === "resume" && data.resumeFile) {
        resumeText = await data.resumeFile.text();
      } else if (data.dataType === "linkedin" && data.linkedinUrl) {
        resumeText = data.linkedinUrl;
      }

      const requestData = {
        goal: data.goal.join(", "),
        careerPath: data.careerPath.join(", "),
        experience: data.experience.join(", "),
        companies: data.companies.join(", "),
        resumeData: resumeText,
        dataType: data.dataType,
      };

      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      setGeneratedEmail(result.email);
      setStep(6);
    } catch (error) {
      console.error("Error generating email:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveEmail = () => {
    router.push("/generate-email");
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white">
            <CardHeader>
              <CardTitle>What are you looking for?</CardTitle>
              <CardDescription className="text-gray-400">
                Select your primary goal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-400 mb-2">
                Select up to 3 options
              </div>
              {["Internships", "Jobs", "Research", "Referrals"].map(
                (option) => {
                  const isSelected = data.goal.includes(option);
                  const canSelect = data.goal.length < 3 || isSelected;
                  return (
                    <Button
                      key={option}
                      variant={isSelected ? "default" : "outline"}
                      className={`w-full justify-start ${isSelected ? "bg-white text-black" : "border-gray-600 text-gray-200 hover:bg-gray-800"} ${!canSelect ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={!canSelect}
                      onClick={() => {
                        if (isSelected) {
                          setData({
                            ...data,
                            goal: data.goal.filter((g) => g !== option),
                          });
                        } else if (data.goal.length < 3) {
                          setData({ ...data, goal: [...data.goal, option] });
                        }
                      }}
                    >
                      {option}
                      {isSelected && <span className="ml-2">✓</span>}
                    </Button>
                  );
                },
              )}
              <div className="text-xs text-gray-500">
                Selected: {data.goal.length}/3
              </div>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white">
            <CardHeader>
              <CardTitle>What's your career path?</CardTitle>
              <CardDescription className="text-gray-400">
                Choose your field of interest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-400 mb-2">
                Select up to 3 career paths
              </div>
              {[
                "Technology",
                "Finance",
                "Law",
                "Healthcare",
                "Marketing",
                "Consulting",
                "Other",
              ].map((option) => {
                const isSelected = data.careerPath.includes(option);
                const canSelect = data.careerPath.length < 3 || isSelected;
                return (
                  <Button
                    key={option}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full justify-start ${isSelected ? "bg-white text-black" : "border-gray-600 text-gray-200 hover:bg-gray-800"} ${!canSelect ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={!canSelect}
                    onClick={() => {
                      if (isSelected) {
                        setData({
                          ...data,
                          careerPath: data.careerPath.filter(
                            (c) => c !== option,
                          ),
                        });
                      } else if (data.careerPath.length < 3) {
                        setData({
                          ...data,
                          careerPath: [...data.careerPath, option],
                        });
                      }
                    }}
                  >
                    {option}
                    {isSelected && <span className="ml-2">✓</span>}
                  </Button>
                );
              })}
              <div className="text-xs text-gray-500">
                Selected: {data.careerPath.length}/3
              </div>
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white">
            <CardHeader>
              <CardTitle>What's your experience level?</CardTitle>
              <CardDescription className="text-gray-400">
                Help us tailor your emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-400 mb-2">
                Select up to 3 experience levels
              </div>
              {["Beginner", "Intermediate", "Expert"].map((option) => {
                const isSelected = data.experience.includes(option);
                const canSelect = data.experience.length < 3 || isSelected;
                return (
                  <Button
                    key={option}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full justify-start ${isSelected ? "bg-white text-black" : "border-gray-600 text-gray-200 hover:bg-gray-800"} ${!canSelect ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={!canSelect}
                    onClick={() => {
                      if (isSelected) {
                        setData({
                          ...data,
                          experience: data.experience.filter(
                            (e) => e !== option,
                          ),
                        });
                      } else if (data.experience.length < 3) {
                        setData({
                          ...data,
                          experience: [...data.experience, option],
                        });
                      }
                    }}
                  >
                    {option}
                    {isSelected && <span className="ml-2">✓</span>}
                  </Button>
                );
              })}
              <div className="text-xs text-gray-500">
                Selected: {data.experience.length}/3
              </div>
            </CardContent>
          </Card>
        );
      case 4:
        return (
          <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white">
            <CardHeader>
              <CardTitle>Target companies</CardTitle>
              <CardDescription className="text-gray-400">
                Which companies interest you?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-400 mb-2">
                Select up to 3 company types
              </div>
              {[
                {
                  value: "FAANG",
                  label: "FAANG (Meta, Apple, Amazon, Netflix, Google)",
                },
                { value: "Investment Banking", label: "Investment Banking" },
                { value: "Consulting", label: "Top Consulting Firms" },
                { value: "Startups", label: "High-Growth Startups" },
                { value: "Fortune 500", label: "Fortune 500 Companies" },
                { value: "Other", label: "Other" },
              ].map(({ value, label }) => {
                const isSelected = data.companies.includes(value);
                const canSelect = data.companies.length < 3 || isSelected;
                return (
                  <Button
                    key={value}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full justify-start text-left ${isSelected ? "bg-white text-black" : "border-gray-600 text-gray-200 hover:bg-gray-800"} ${!canSelect ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={!canSelect}
                    onClick={() => {
                      if (isSelected) {
                        setData({
                          ...data,
                          companies: data.companies.filter((c) => c !== value),
                        });
                      } else if (data.companies.length < 3) {
                        setData({
                          ...data,
                          companies: [...data.companies, value],
                        });
                      }
                    }}
                  >
                    <span className="truncate">{label}</span>
                    {isSelected && <span className="ml-2">✓</span>}
                  </Button>
                );
              })}
              <div className="text-xs text-gray-500">
                Selected: {data.companies.length}/3
              </div>
            </CardContent>
          </Card>
        );
      case 5:
        return (
          <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white">
            <CardHeader>
              <CardTitle>Upload your profile</CardTitle>
              <CardDescription className="text-gray-400">
                Share your resume or LinkedIn profile URL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Button
                  variant={data.dataType === "resume" ? "default" : "outline"}
                  className={`w-full justify-start ${data.dataType === "resume" ? "bg-white text-black" : "border-gray-600 text-gray-200 hover:bg-gray-800"}`}
                  onClick={() => setData({ ...data, dataType: "resume" })}
                >
                  <FileText className="mr-2 w-4 h-4" />
                  Upload Resume
                </Button>
                <Button
                  variant={data.dataType === "linkedin" ? "default" : "outline"}
                  className={`w-full justify-start ${data.dataType === "linkedin" ? "bg-white text-black" : "border-gray-600 text-gray-200 hover:bg-gray-800"}`}
                  onClick={() => setData({ ...data, dataType: "linkedin" })}
                >
                  <Linkedin className="mr-2 w-4 h-4" />
                  LinkedIn Profile URL
                </Button>
              </div>
              {data.dataType === "resume" && (
                <div className="mt-4">
                  <Label htmlFor="resumeFile" className="text-white">
                    Upload Resume File
                  </Label>
                  <input
                    id="resumeFile"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="w-full mt-2 p-3 bg-gray-800 border border-gray-700 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setData({ ...data, resumeFile: file });
                    }}
                  />
                  {data.resumeFile && (
                    <div className="mt-2 text-sm text-gray-400">
                      Selected: {data.resumeFile.name}
                    </div>
                  )}
                </div>
              )}
              {data.dataType === "linkedin" && (
                <div className="mt-4">
                  <Label htmlFor="linkedinUrl" className="text-white">
                    LinkedIn Profile URL
                  </Label>
                  <Input
                    id="linkedinUrl"
                    type="url"
                    className="w-full mt-2 bg-gray-800 border-gray-700 text-white"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={data.linkedinUrl}
                    onChange={(e) =>
                      setData({ ...data, linkedinUrl: e.target.value })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 6:
        return (
          <Card className="w-full max-w-2xl bg-gray-900 border-gray-800 text-white">
            <CardHeader>
              <CardTitle>Review your email</CardTitle>
              <CardDescription className="text-gray-400">
                AI-generated email based on your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400 mb-2">
                  Subject: {data.goal} Opportunity - [Your Name]
                </div>
                <textarea
                  className="w-full bg-transparent text-white min-h-[200px] resize-none border-none outline-none"
                  value={generatedEmail}
                  onChange={(e) => setGeneratedEmail(e.target.value)}
                  placeholder="Your personalized email will appear here..."
                />
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={handleGenerateEmail}
                  disabled={isLoading}
                  className="bg-gray-700 text-white hover:bg-gray-600"
                >
                  {isLoading ? "Generating..." : "Regenerate Email"}
                </Button>
                <Button
                  onClick={handleApproveEmail}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  Approve & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-sm">Step {step} of 6</span>
            <span className="text-gray-400 text-sm">
              {Math.round((step / 6) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="flex justify-center mb-8">{renderStep()}</div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            onClick={handleBack}
            disabled={step === 1}
            variant="outline"
            className="border-gray-600 text-gray-200 hover:bg-gray-800"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          {step < 5 && (
            <Button
              onClick={handleNext}
              disabled={(() => {
                switch (step) {
                  case 1:
                    return data.goal.length === 0;
                  case 2:
                    return data.careerPath.length === 0;
                  case 3:
                    return data.experience.length === 0;
                  case 4:
                    return data.companies.length === 0;
                  default:
                    return false;
                }
              })()}
              className="bg-white text-black hover:bg-gray-200"
            >
              Next
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
          {step === 5 && (
            <Button
              onClick={handleGenerateEmail}
              disabled={(() => {
                if (isLoading) return true;
                if (data.dataType === "resume") return !data.resumeFile;
                if (data.dataType === "linkedin") return !data.linkedinUrl;
                return !data.dataType;
              })()}
              className="bg-white text-black hover:bg-gray-200"
            >
              {isLoading ? "Generating..." : "Generate Email"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}