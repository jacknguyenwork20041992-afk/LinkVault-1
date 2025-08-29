import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function chatWithGeminiAI(
  message: string,
  knowledgeContext: any,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<string> {
  try {
    // Build system prompt with knowledge context
    const systemPrompt = `Bạn là trợ lý AI của VIA English Academy, một trung tâm tiếng Anh chuyên nghiệp. 
Hãy trả lời bằng tiếng Việt một cách thân thiện, hữu ích và chuyên nghiệp.

THÔNG TIN VỀ TRUNG TÂM:
${knowledgeContext.programs?.length > 0 ? `
CHƯƠNG TRÌNH HỌC:
${knowledgeContext.programs.map((p: any) => `- ${p.name} (${p.level}): ${p.description}`).join('\n')}
` : ''}

${knowledgeContext.documents?.length > 0 ? `
TÀI LIỆU HỌC TẬP:
${knowledgeContext.documents.map((d: any) => `- ${d.title}: ${d.description || 'Tài liệu học tập'}`).join('\n')}
` : ''}

${knowledgeContext.notifications?.length > 0 ? `
THÔNG BÁO MỚI:
${knowledgeContext.notifications.map((n: any) => `- ${n.title}: ${n.content}`).join('\n')}
` : ''}

${knowledgeContext.projects?.length > 0 ? `
DỰ ÁN HIỆN TẠI:
${knowledgeContext.projects.map((p: any) => `- ${p.name}: ${p.description}`).join('\n')}
` : ''}

${knowledgeContext.importantDocuments?.length > 0 ? `
TÀI LIỆU QUAN TRỌNG:
${knowledgeContext.importantDocuments.map((d: any) => `- ${d.title}: ${d.description || 'Tài liệu quan trọng'}`).join('\n')}
` : ''}

Hãy sử dụng thông tin này để trả lời câu hỏi của người dùng một cách chính xác và hữu ích.
Nếu không có thông tin cụ thể, hãy đưa ra lời khuyên chung về việc học tiếng Anh.`;

    // Convert conversation history to Gemini format
    const conversationContents = [];
    
    // Add conversation history
    for (const msg of conversationHistory) {
      conversationContents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      });
    }
    
    // Add current user message
    conversationContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: conversationContents,
    });

    return response.text || "Xin lỗi, tôi không thể trả lời câu hỏi này lúc này.";
  } catch (error) {
    console.error("Gemini AI error:", error);
    throw new Error("Không thể kết nối với dịch vụ AI. Vui lòng thử lại sau.");
  }
}