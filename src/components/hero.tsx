import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../../supabase/client";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

export default function Hero() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/sign-up");
    }
    setLoading(false);
  };

  return (
    <div className="relative overflow-hidden bg-black text-white">
      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold mb-8 tracking-tight">
              Land Your Dream
              <span className="block text-gray-400">Internship</span>
            </h1>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Automate your cold email outreach to recruiters with AI-powered personalization
            </p>
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-4"
              onClick={handleGetStarted}
              disabled={loading}
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
