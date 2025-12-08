import { GoogleGenAI, Schema, Type } from "@google/genai";
import { CareerPixelResponse, WeekPlan, UserPreferences } from "../types";

const careerPixelSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    user_persona: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING },
        psych_profile: { type: Type.STRING },
        archetype: { type: Type.STRING }
      },
      required: ["headline", "psych_profile", "archetype"]
    },
    parsed_data: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        email: { type: Type.STRING },
        location: { type: Type.STRING },
        education: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              institution: { type: Type.STRING },
              degree: { type: Type.STRING },
              start_date: { type: Type.STRING },
              end_date: { type: Type.STRING },
              gpa_or_grade: { type: Type.STRING }
            }
          }
        },
        experience: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              company: { type: Type.STRING },
              role: { type: Type.STRING },
              start_date: { type: Type.STRING },
              end_date: { type: Type.STRING },
              responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
              achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
              impact_metrics: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
        projects: { type: Type.ARRAY, items: { type: Type.STRING } },
        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
        certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
        extras: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["name"]
    },
    ats_audit: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        verdict: { type: Type.STRING },
        score_breakdown: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "e.g. Impact, Keywords, Format" },
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING }
            }
          }
        },
        critical_fixes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              section: { type: Type.STRING },
              fix: { type: Type.STRING }
            }
          }
        },
        formatting_tips: { type: Type.ARRAY, items: { type: Type.STRING } },
        keyword_gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["score", "verdict"]
    },
    swot_analysis: {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        threats: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["strengths", "weaknesses", "opportunities", "threats"]
    },
    career_map: {
      type: Type.OBJECT,
      properties: {
        best_fit_roles: { 
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING },
              match_percentage: { type: Type.NUMBER },
              salary_range: { type: Type.STRING },
              why_it_fits: { type: Type.STRING }
            }
          }
        },
        top_companies: { type: Type.ARRAY, items: { type: Type.STRING } },
        gap_analysis: {
          type: Type.OBJECT,
          properties: {
            skill_gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            experience_gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            project_gaps: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      },
      required: ["best_fit_roles", "top_companies", "gap_analysis"]
    },
    prep_roadmap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          week: { type: Type.STRING },
          theme: { type: Type.STRING },
          daily_tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
          resources: { type: Type.ARRAY, items: { type: Type.STRING } },
          deliverables: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  },
  required: ["user_persona", "parsed_data", "ats_audit", "swot_analysis", "career_map", "prep_roadmap"]
};

const SYSTEM_INSTRUCTION = `
YOUR PRIMARY MISSION
Transform resume text + user aspirations into a high-precision career strategy.
Style: Professional, Executive, Analytical, Direct, SaaS-Product tone.
IMPORTANT: Do NOT use emojis. Use clean, professional language only.

1. PSYCHOANALYSIS (Executive Summary Style)
   - Do NOT list facts from the resume.
   - Write a concise, high-level executive summary of their professional profile.
   - Analyze their career trajectory and hidden drivers.

2. ATS AUDIT (Technical & Data-Driven)
   - Score out of 100.
   - Provide granular, actionable fixes. Use technical language where appropriate.

3. SWOT ANALYSIS
   - Strengths: Key competitive advantages.
   - Weaknesses: Critical gaps or liabilities.
   - Opportunities: High-leverage market openings.
   - Threats: Market risks and obsolescence factors.

4. CAREER MAP & BEST FIT ROLES
   - Identify EXACTLY 3 "Best Fit Roles".
   - Calculate match percentage and estimated salary range.
   - Top Companies: Suggest 6-8 industry leaders.

5. GAP ANALYSIS
   - Skill/Experience/Project Bridge: Be specific and actionable.

6. AVATAR PROMPT
   - Infer a prompt for a professional, photorealistic representation of a modern professional in their field.
   - Example: "Professional data scientist analyzing holographic charts in a modern glass office, cinematic lighting, 8k."

Be professional. Be strategic. Be concise. No fluff. No emojis.
`;

const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key) throw new Error("API Key is missing.");
  return key;
};

// Retry helper for 503 Overloaded errors
const callWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isOverloaded = error?.status === 503 || error?.code === 503 || error?.message?.includes('overloaded');
    if (retries > 0 && isOverloaded) {
      console.warn(`Model overloaded. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
};

// Main Analysis (gemini-2.5-flash)
export const analyzeCareer = async (resumeText: string, aspirations: string, preferences: UserPreferences): Promise<CareerPixelResponse> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const prefString = `
    Target Role Functions: ${preferences.targetRole}
    Target Industries: ${preferences.targetIndustry}
    Target Company Types: ${preferences.targetCompanyType}
    Target Locations: ${preferences.targetLocation}
  `;
  
  const prompt = `RESUME TEXT:\n${resumeText}\n\nUSER ASPIRATIONS:\n${aspirations}\n\nUSER PREFERENCES:\n${prefString}\n\nAnalyze this profile comprehensively.`;

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: careerPixelSchema,
        temperature: 0.2
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as CareerPixelResponse;
    }
    throw new Error("Empty response from Gemini");
  });
};

// Fast Polish (gemini-2.5-flash)
export const quickPolishAspirations = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Rewrite this career aspiration to be professional, ambitious, and concise (max 2 sentences). Do not use emojis. Text: "${text}"`
    });
    return response.text || text;
  });
};

// Search Grounding (gemini-2.5-flash with googleSearch)
export const getMarketInsights = async (role: string, location: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find real-time market data for the role of ${role} in ${location}. 
      Provide a concise summary with:
      - Current Salary Trends
      - Top Hiring Companies (Real-time)
      - Hot Skills in Demand
      
      Format as a clean, readable paragraph or bullet points. Do not use Markdown headers. Do not use emojis.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    return response.text || "Could not retrieve market data.";
  });
};

// Deep Thinking Strategy (gemini-3-pro-preview with thinking)
export const generateDeepStrategy = async (profile: string, goal: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `User Profile Summary: ${profile}. Goal: ${goal}.
      Generate a deep, strategic 5-year master plan. 
      Focus on non-obvious moves, high-leverage networking, and specific milestones.
      Think deeply about market trends and professional development.`,
      config: {
        thinkingConfig: { thinkingBudget: 16384 }
      }
    });
    return response.text || "Strategy generation failed.";
  });
};

// Image Generation (gemini-3-pro-image-preview)
export const generateCareerAvatar = async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  // Enforce professional style
  const enhancedPrompt = `${prompt}. Professional corporate photography, cinematic lighting, 8k resolution, highly detailed, office environment, elegant, sleek.`;
  
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated.");
  });
};

// Chatbot (gemini-3-pro-preview)
export const createChatSession = () => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are an executive career coach. Your tone is professional, encouraging, and highly strategic. Do NOT use emojis. Provide actionable, data-backed advice."
    }
  });
};

// Custom Roadmap Generation
export const generateCustomRoadmap = async (psychProfile: string, role: string, durationWeeks: number): Promise<WeekPlan[]> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const prompt = `
    User Psych Profile: ${psychProfile}
    Target Role: ${role}
    Duration: ${durationWeeks} weeks.

    Generate a customized, week-by-week professional development roadmap.
    For each week, define a Theme, Daily Tasks (specific actions), Resources (books, courses, urls), and Deliverables (tangible outcomes).
    Do not use emojis.
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        week: { type: Type.STRING },
        theme: { type: Type.STRING },
        daily_tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
        resources: { type: Type.ARRAY, items: { type: Type.STRING } },
        deliverables: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["week", "theme", "daily_tasks", "resources", "deliverables"]
    }
  };

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as WeekPlan[];
    }
    return [];
  });
};