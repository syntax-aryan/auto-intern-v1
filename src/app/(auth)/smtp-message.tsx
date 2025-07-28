import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function SmtpMessage() {
  return (
    <Alert className="mt-4 border-blue-700 bg-blue-900 text-blue-100">
      <Info className="h-4 w-4" />
      <AlertDescription>
        If you don't receive the email, please check your spam folder. 
        If the issue persists, contact support for assistance with SMTP configuration.
      </AlertDescription>
    </Alert>
  );
} 
