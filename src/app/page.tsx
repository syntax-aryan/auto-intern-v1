import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ArrowRight, Target, Mail, BarChart3, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Aurora from "@/components/Aurora";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px]">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
        <div className="absolute inset-0 z-10">
          <Navbar />
        </div>
      </div>
      {/* Hero Section */}
      <section className="pt-8 pb-16 -mt-16 md:-mt-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold mb-6 tracking-tight">
            Land Your Dream
            <span className="block text-gray-400">Internship</span>
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Automate your cold email outreach to recruiters with AI-powered
            personalization
          </p>
          <Link href="/sign-up">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-4"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
      {/* How It Works Section */}
      <section className="py-20 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">
            How Auto Intern Works
          </h2>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">
                1. Set Your Goals
              </h3>
              <p className="text-gray-400">
                Tell us what you're looking for: internships, jobs, research
                opportunities, or referrals
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">
                2. Upload Your Profile
              </h3>
              <p className="text-gray-400">
                Share your resume or LinkedIn profile for AI-powered email
                personalization
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">
                3. Review & Send
              </h3>
              <p className="text-gray-400">
                Approve AI-generated professional emails before we send them to
                recruiters
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">
                4. Track Results
              </h3>
              <p className="text-gray-400">
                Monitor response rates and optimize your outreach strategy
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-20 border-t border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-white">
                Smart Email Automation
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Our AI analyzes your background and creates personalized emails
                that get responses from recruiters at top companies.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-white">
                    Personalized email generation
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-white">
                    Target FAANG, Investment Banks, and more
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-white">
                    Professional resume optimization
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400 mb-4">
                Generated Email Preview
              </div>
              <div className="bg-black p-4 rounded border border-gray-600 font-mono text-sm">
                <div className="text-gray-400 mb-2">
                  Subject: Software Engineering Intern - [Your Name]
                </div>
                <div className="text-white leading-relaxed">
                  Dear [Recruiter Name],
                  <br />
                  <br />
                  I'm a computer science student at [University] with experience
                  in [Technologies]. I'm particularly interested in [Company]'s
                  work in [Specific Area]...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Land Your Dream Role?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Join students who've successfully landed internships at top
            companies
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-4"
              >
                Start Free Trial
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-4"
              >
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
