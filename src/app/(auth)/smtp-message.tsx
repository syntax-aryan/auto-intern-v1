import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function SmtpMessage() {
  return (
    < Alert className="mt-4 border-blue-200 bg-blue-50 text-blue-800">
      <Info className="h-4 w-4" />
      <AlertDescription>
        If you don't receive the email, please check your spam folder. 
      </AlertDescription>
    </Alert>
  );
} 