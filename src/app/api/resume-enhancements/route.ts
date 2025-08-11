import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { resumeText, answers } = await request.json();

    if (!resumeText || !answers) {
      return NextResponse.json(
        { error: "Resume text and answers are required" },
        { status: 400 },
      );
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await (await supabase).auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Check user subscription and limits
    const { data: userData, error: userError } = await (await supabase)
      .from("users")
      .select("subscription_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.subscription_id) {
      return NextResponse.json(
        { error: "Premium subscription required for Resume Builder" },
        { status: 403 },
      );
    }

    // Process answers to create enhancement context
    const answerMap = answers.reduce((acc: any, answer: any) => {
      acc[answer.questionId] = answer.answer;
      return acc;
    }, {});

    // Create AI prompt for resume enhancement
    const enhancementPrompt = `
You are an expert resume writer and career coach. Please enhance the following resume based on the user's responses:

ORIGINAL RESUME:
${resumeText}

USER PREFERENCES:
- Target Role: ${answerMap["target-role"] || "Not specified"}
- Technical Skills: ${answerMap["technical-skills"] || "Not specified"}
- Key Achievements: ${answerMap["achievements"] || "Not specified"}
- Measurable Metrics: ${answerMap["metrics"] || "Not specified"}
- Target Industries: ${answerMap["industries"] || "Not specified"}
- Resume Style: ${answerMap["resume-style"] || "ATS-Optimized"}
- Experience Level: ${answerMap["experience-level"] || "Not specified"}
- Career Focus: ${answerMap["career-focus"] || "Not specified"}

Please enhance this resume by:
1. Improving wording and phrasing for better impact
2. Optimizing for ATS compatibility with relevant keywords
3. Restructuring content for better flow and readability
4. Adding action verbs and quantifiable achievements
5. Tailoring content to the target role and industry
6. Ensuring professional formatting and consistency

Return only the enhanced resume text without any additional commentary or explanations.
`;

    // In a production environment, you would call an AI service like OpenAI here
    // For this demo, we'll create a mock enhanced resume
    const enhancedResume = await mockAIEnhancement(resumeText, answerMap);

    // Log the resume enhancement activity
    await (await supabase).from("resume_enhancements").insert({
      user_id: user.id,
      original_resume: resumeText,
      enhanced_resume: enhancedResume,
      answers: answers,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      enhancedResume,
      message: "Resume enhanced successfully",
    });
  } catch (error) {
    console.error("Resume enhancement error:", error);
    return NextResponse.json(
      { error: "Failed to enhance resume" },
      { status: 500 },
    );
  }
}

// Mock AI enhancement function - replace with actual AI service in production
async function mockAIEnhancement(
  originalResume: string,
  answers: any,
): Promise<string> {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const targetRole = answers["target-role"] || "Software Engineer";
  const skills = answers["technical-skills"] || "JavaScript, React, Node.js";
  const achievements = answers["achievements"] || "Led successful projects";
  const metrics = answers["metrics"] || "Improved efficiency by 25%";
  const industry = answers["industries"] || "Technology";
  const experienceLevel = answers["experience-level"] || "Mid Level";

  // Create an enhanced version with improvements
  const enhancedResume = `
=== ENHANCED RESUME ===

[PROFESSIONAL SUMMARY]
Results-driven ${targetRole} with proven expertise in ${skills}. ${achievements} with measurable impact including ${metrics}. Seeking to leverage technical excellence and leadership skills in the ${industry} industry.

[CORE COMPETENCIES]
• ${skills
    .split(",")
    .map((skill: string) => skill.trim())
    .join(" • ")}
• Project Leadership & Team Collaboration
• Agile Development Methodologies
• Problem-Solving & Critical Thinking
• Client Relations & Stakeholder Management

[PROFESSIONAL EXPERIENCE]

${experienceLevel} ${targetRole} | Previous Company | 2020 - Present
• ${achievements} resulting in ${metrics}
• Collaborated with cross-functional teams to deliver high-quality solutions
• Implemented best practices for code quality and performance optimization
• Mentored junior developers and contributed to team knowledge sharing
• Participated in agile development processes and sprint planning

[TECHNICAL SKILLS]
Programming Languages: ${skills}
Frameworks & Tools: Modern development stack
Databases: SQL and NoSQL technologies
Cloud Platforms: AWS, Azure, or Google Cloud
Version Control: Git, GitHub/GitLab

[EDUCATION]
Bachelor's Degree in Computer Science or related field
Relevant Certifications and Continuous Learning

[KEY ACHIEVEMENTS]
• ${achievements}
• ${metrics}
• Consistently delivered projects on time and within budget
• Received recognition for technical excellence and innovation

---
This resume has been optimized for ATS compatibility and tailored for ${targetRole} positions in the ${industry} industry.
`;

  return enhancedResume;
}