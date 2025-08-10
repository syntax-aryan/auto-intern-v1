"use client";

import { useState, useRef, useEffect } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import {
  Upload,
  FileText,
  Download,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
  MessageCircle,
  Bot,
  User,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface Question {
  id: string;
  question: string;
  type: "text" | "textarea" | "select" | "multiselect";
  options?: string[];
  placeholder?: string;
}

interface Answer {
  questionId: string;
  answer: string | string[];
}

interface ChatMessage {
  type: "bot" | "user";
  content: string;
  timestamp: Date;
}

const questions: Question[] = [
  {
    id: "target-role",
    question: "What role(s) are you targeting?",
    type: "text",
    placeholder: "e.g., Software Engineer, Product Manager, Data Scientist",
  },
  {
    id: "technical-skills",
    question: "What are your top 3 technical skills?",
    type: "text",
    placeholder: "e.g., Python, React, Machine Learning",
  },
  {
    id: "achievements",
    question: "What are your biggest achievements in your last role?",
    type: "textarea",
    placeholder: "Describe your key accomplishments and their impact...",
  },
  {
    id: "metrics",
    question: "Do you have measurable metrics to showcase impact?",
    type: "textarea",
    placeholder:
      "e.g., Increased sales by 25%, Reduced processing time by 40%...",
  },
  {
    id: "industries",
    question: "Which industries are you applying to?",
    type: "select",
    options: [
      "Technology",
      "Finance",
      "Healthcare",
      "Consulting",
      "Marketing",
      "Education",
      "Manufacturing",
      "Other",
    ],
  },
  {
    id: "resume-style",
    question:
      "Do you want a creative style or a corporate ATS-optimized style?",
    type: "select",
    options: [
      "ATS-Optimized (Recommended)",
      "Creative Style",
      "Balanced Approach",
    ],
  },
  {
    id: "experience-level",
    question: "What's your experience level?",
    type: "select",
    options: [
      "Entry Level (0-2 years)",
      "Mid Level (3-5 years)",
      "Senior Level (6+ years)",
    ],
  },
  {
    id: "career-focus",
    question: "What's your primary career focus?",
    type: "select",
    options: [
      "Leadership & Management",
      "Technical Expertise",
      "Innovation & Strategy",
      "Client Relations",
      "Operations & Efficiency",
    ],
  },
];

type Step = "upload" | "questionnaire" | "processing" | "review";

export default function ResumeBuilder() {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<string | string[]>("");
  const [originalResume, setOriginalResume] = useState("");
  const [enhancedResume, setEnhancedResume] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const getStepProgress = () => {
    switch (currentStep) {
      case "upload":
        return 25;
      case "questionnaire":
        return 50 + (currentQuestionIndex / questions.length) * 25;
      case "processing":
        return 75;
      case "review":
        return 100;
      default:
        return 0;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "upload":
        return "Upload Resume";
      case "questionnaire":
        return "Questionnaire";
      case "processing":
        return "AI Enhancement";
      case "review":
        return "Review & Download";
      default:
        return "Resume Builder";
    }
  };

  useEffect(() => {
    if (currentStep === "questionnaire" && chatMessages.length === 0) {
      // Start the questionnaire
      setTimeout(() => {
        addBotMessage(questions[0].question);
      }, 500);
    }
  }, [currentStep]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const addBotMessage = (message: string) => {
    setIsTyping(true);
    setTimeout(
      () => {
        setChatMessages((prev) => [
          ...prev,
          { type: "bot", content: message, timestamp: new Date() },
        ]);
        setIsTyping(false);
      },
      1000 + Math.random() * 1000,
    ); // Random typing delay
  };

  const addUserMessage = (message: string) => {
    setChatMessages((prev) => [
      ...prev,
      { type: "user", content: message, timestamp: new Date() },
    ]);
  };

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setError("");

    // Extract text from file (simplified - in production, use proper PDF/DOCX parsing)
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setResumeText(text);
      setOriginalResume(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (
        file.type.includes("pdf") ||
        file.type.includes("doc") ||
        file.type.includes("text")
      ) {
        handleFileUpload(file);
      } else {
        setError("Please upload a PDF, DOC, or TXT file");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleAnswerSubmit = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const answerText = Array.isArray(currentAnswer)
      ? currentAnswer.join(", ")
      : currentAnswer;

    if (!answerText.trim()) return;

    // Add user message
    addUserMessage(answerText);

    // Save answer
    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      answer: currentAnswer,
    };
    setAnswers((prev) => [...prev, newAnswer]);

    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer("");
      setTimeout(() => {
        addBotMessage(questions[currentQuestionIndex + 1].question);
      }, 1500);
    } else {
      // Questionnaire complete
      setTimeout(() => {
        addBotMessage(
          "Perfect! I have all the information I need. Let me enhance your resume now.",
        );
        setTimeout(() => {
          setCurrentStep("processing");
          processResume();
        }, 2000);
      }, 1500);
    }
  };

  const processResume = async () => {
    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/resume-enhancement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: originalResume,
          answers: answers,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setEnhancedResume(result.enhancedResume);
        setCurrentStep("review");
      } else {
        setError(result.error || "Failed to enhance resume");
      }
    } catch (error) {
      setError("Failed to process resume");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResume = (format: "pdf" | "docx") => {
    // In production, implement actual PDF/DOCX generation
    const blob = new Blob([enhancedResume], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enhanced-resume.${format === "pdf" ? "txt" : "txt"}`; // Simplified for demo
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderUploadStep = () => (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-white text-2xl">
            Upload Your Resume
          </CardTitle>
          <CardDescription className="text-gray-400">
            Upload your current resume in PDF, DOCX, or TXT format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-gray-500 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Drag & drop your resume here
            </h3>
            <p className="text-gray-400 mb-4">or click to browse files</p>
            <Button className="bg-white text-black hover:bg-gray-200">
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {uploadedFile && (
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-white font-medium">{uploadedFile.name}</p>
                  <p className="text-gray-400 text-sm">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-400 ml-auto" />
              </div>
            </div>
          )}

          {resumeText && (
            <div className="mt-6">
              <Label className="text-white mb-2 block">Resume Preview</Label>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-gray-300 text-sm whitespace-pre-wrap">
                  {resumeText.substring(0, 500)}...
                </pre>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => setCurrentStep("questionnaire")}
              disabled={!uploadedFile || !resumeText}
              className="bg-white text-black hover:bg-gray-200"
            >
              Continue to Questionnaire
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderQuestionnaireStep = () => (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-2xl">
            Let's Optimize Your Resume
          </CardTitle>
          <CardDescription className="text-gray-400">
            Answer a few questions to help me create the perfect resume for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Chat Interface */}
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 mb-4 ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.type === "bot" && (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === "user"
                          ? "bg-white text-black ml-auto"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    {message.type === "user" && (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-700 text-white px-4 py-2 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Answer Input */}
            <div className="space-y-4">
              {currentQuestionIndex < questions.length && (
                <div>
                  <Label className="text-white mb-2 block">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </Label>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-4">
                      {questions[currentQuestionIndex].question}
                    </h3>

                    {questions[currentQuestionIndex].type === "text" && (
                      <Input
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder={
                          questions[currentQuestionIndex].placeholder
                        }
                        value={currentAnswer as string}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleAnswerSubmit()
                        }
                      />
                    )}

                    {questions[currentQuestionIndex].type === "textarea" && (
                      <Textarea
                        className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                        placeholder={
                          questions[currentQuestionIndex].placeholder
                        }
                        value={currentAnswer as string}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                      />
                    )}

                    {questions[currentQuestionIndex].type === "select" && (
                      <Select
                        value={currentAnswer as string}
                        onValueChange={(value) => setCurrentAnswer(value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {questions[currentQuestionIndex].options?.map(
                            (option) => (
                              <SelectItem
                                key={option}
                                value={option}
                                className="text-white hover:bg-gray-700"
                              >
                                {option}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    )}

                    <Button
                      onClick={handleAnswerSubmit}
                      disabled={!currentAnswer || isTyping}
                      className="mt-4 bg-white text-black hover:bg-gray-200 w-full"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Answer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-12 pb-12">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                AI is Enhancing Your Resume
              </h3>
              <p className="text-gray-400">
                Please wait while I optimize your resume for ATS compatibility
                and recruiter appeal...
              </p>
            </div>
            <div className="w-full max-w-md">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Analyzing content...</span>
                <span>Processing...</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReviewStep = () => (
    <div className="max-w-7xl mx-auto">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-2xl">
            Review Your Enhanced Resume
          </CardTitle>
          <CardDescription className="text-gray-400">
            Compare your original resume with the AI-enhanced version
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Original Resume */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Original Resume
              </h3>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-96 overflow-y-auto">
                <pre className="text-gray-300 text-sm whitespace-pre-wrap">
                  {originalResume}
                </pre>
              </div>
            </div>

            {/* Enhanced Resume */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                AI-Enhanced Resume
              </h3>
              <div className="bg-gray-800 border border-green-600 rounded-lg p-4 h-96 overflow-y-auto">
                <pre className="text-gray-300 text-sm whitespace-pre-wrap">
                  {enhancedResume}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => downloadResume("pdf")}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download as PDF
            </Button>
            <Button
              onClick={() => downloadResume("docx")}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download as DOCX
            </Button>
            <Button
              onClick={() => {
                setCurrentStep("upload");
                setUploadedFile(null);
                setResumeText("");
                setAnswers([]);
                setChatMessages([]);
                setCurrentQuestionIndex(0);
                setCurrentAnswer("");
                setOriginalResume("");
                setEnhancedResume("");
              }}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              Start Over
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8">
          {/* Header with Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-4xl font-bold text-white">Resume Builder</h1>
              <div className="text-sm text-gray-400">
                Step{" "}
                {currentStep === "upload"
                  ? 1
                  : currentStep === "questionnaire"
                    ? 2
                    : currentStep === "processing"
                      ? 3
                      : 4}{" "}
                of 4
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Upload</span>
                <span>Questionnaire</span>
                <span>AI Enhancement</span>
                <span>Review & Download</span>
              </div>
              <Progress value={getStepProgress()} className="h-2" />
            </div>
            <h2 className="text-xl text-gray-300">{getStepTitle()}</h2>
          </div>

          {/* Step Content */}
          {currentStep === "upload" && renderUploadStep()}
          {currentStep === "questionnaire" && renderQuestionnaireStep()}
          {currentStep === "processing" && renderProcessingStep()}
          {currentStep === "review" && renderReviewStep()}

          {/* Navigation */}
          {currentStep !== "upload" && currentStep !== "processing" && (
            <div className="mt-8 flex justify-between max-w-7xl mx-auto">
              <Button
                onClick={() => {
                  if (currentStep === "questionnaire") setCurrentStep("upload");
                  if (currentStep === "review") setCurrentStep("questionnaire");
                }}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
