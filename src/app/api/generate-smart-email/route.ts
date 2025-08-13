import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

// Note: You'll need to add OPENAI_API_KEY to your environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inputType, inputContent, targetCompany, position } =
      await request.json();

    if (!inputContent || !targetCompany || !position) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let processedContent = inputContent;

    // If it's a LinkedIn URL, we would normally scrape it here
    // For now, we'll use a placeholder approach
    if (inputType === "linkedin") {
      // In a real implementation, you would scrape the LinkedIn profile
      // For demo purposes, we'll use the URL as context
      processedContent = `LinkedIn Profile: ${inputContent}`;
    }

    // Generate email using ChatGPT API
    let generatedEmail;

    if (OPENAI_API_KEY) {
      try {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content:
                    "You are an expert at writing professional cold emails for job applications. Create personalized, compelling emails that highlight relevant experience and show genuine interest in the company and role.",
                },
                {
                  role: "user",
                  content: `Create a professional cold email for a ${position} position at ${targetCompany}. Use this background information to personalize the email: ${processedContent}. \n\nThe email should:\n- Be professional but personable\n- Highlight relevant experience from the background\n- Show specific interest in the company\n- Be concise (under 200 words)\n- Include a clear call to action\n- Not include placeholder text like [Your Name]\n\nReturn only the email body, no subject line.`,
                },
              ],
              max_tokens: 500,
              temperature: 0.7,
            }),
          },
        );
        
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        generatedEmail = data.choices[0]?.message?.content?.trim();

        if (!generatedEmail) {
          throw new Error("No email content generated");
        }
      } catch (error) {
        console.error("OpenAI API error:", error);
        // Fallback to template-based generation
        generatedEmail = generateFallbackEmail(
          processedContent,
          targetCompany,
          position,
        );
      }
    } else {
      // Fallback when no OpenAI API key is provided
      generatedEmail = generateFallbackEmail(
        processedContent,
        targetCompany,
        position,
      );
    }

    return NextResponse.json({ email: generatedEmail });
  } catch (error) {
    console.error("Error generating email:", error);
    return NextResponse.json(
      { error: "Failed to generate email" },
      { status: 500 },
    );
  }
}

function generateFallbackEmail(
  content: string,
  company: string,
  position: string,
): string {
  return `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${position} position at ${company}, which I discovered through [Platform where you saw the opening, e.g., LinkedIn, company careers page].\n\nWith a background in [mention your key skill or area of expertise, e.g., software development, data analysis], I have developed a strong foundation in [mention a specific skill, e.g., Python, JavaScript]. I am particularly drawn to ${company}'s work in [mention a specific project or area of work at the company] and am confident that my skills would be a valuable asset to your team.\n\nI am eager to learn more about this opportunity and discuss how my experience can contribute to your company's success. I have attached my resume for your review and look forward to hearing from you soon.\n\nThank you for your time and consideration.\n\nBest regards,\n[Your Name]`;
}
