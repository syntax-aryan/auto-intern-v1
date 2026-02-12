import { encodedRedirect } from "@/utils/utils";

export default function SuccessPage() {
  // Redirect to the home page with a success message that will be shown as a banner.
  return encodedRedirect(
    "success",
    "/",
    "Your email has been verified successfully. You can now sign in and start using Auto Intern.",
  );
}
