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
    // Build enhanced system prompt with knowledge context including FAQ and articles
    const systemPrompt = `Bạn là trợ lý AI thông minh của VIA English Academy, một trung tâm tiếng Anh chuyên nghiệp và uy tín. 
Hãy trả lời bằng tiếng Việt một cách thân thiện, chi tiết, hữu ích và chuyên nghiệp.

HƯỚNG DẪN TRẢ LỜI:
- Luôn sử dụng thông tin CHÍNH XÁC từ cơ sở dữ liệu
- Trả lời chi tiết và cụ thể, không trả lời chung chung
- Nếu có FAQ phù hợp, ưu tiên sử dụng câu trả lời từ FAQ
- Nếu có bài viết liên quan, tham khảo nội dung để đưa ra câu trả lời đầy đủ
- Khi không có thông tin cụ thể, nói rõ và đưa ra gợi ý hữu ích

CƠ SỞ KIẾN THỨC VIA ENGLISH ACADEMY:

${knowledgeContext.knowledgeBase?.length > 0 ? `
📚 KIẾN THỨC CƠ BẢN VÀ FAQ:
${knowledgeContext.knowledgeBase.map((kb: any) => `
🏷️ Danh mục: ${kb.category}

❓ CÂU HỎI THƯỜNG GẶP:
${kb.faqs.map((faq: any) => `• Q: ${faq.question}
  A: ${faq.answer}
  Keywords: ${faq.keywords?.join(', ') || 'N/A'}`).join('\n')}

📖 BÀI VIẾT CHI TIẾT:
${kb.articles.map((article: any) => `• ${article.title}
  Nội dung: ${article.content}
  Keywords: ${article.keywords?.join(', ') || 'N/A'}`).join('\n')}
`).join('\n')}
` : ''}

${knowledgeContext.programs?.length > 0 ? `
🎓 CHƯƠNG TRÌNH HỌC:
${knowledgeContext.programs.map((p: any) => `- ${p.name} (${p.level}): ${p.description || 'Chương trình đào tạo chuyên nghiệp'}
${p.categories?.length > 0 ? `  Danh mục tài liệu: ${p.categories.map((c: any) => c.name).join(', ')}` : ''}`).join('\n')}
` : ''}

${knowledgeContext.notifications?.length > 0 ? `
📢 THÔNG BÁO MỚI NHẤT:
${knowledgeContext.notifications.slice(0, 5).map((n: any) => `- ${n.title}: ${n.message}`).join('\n')}
` : ''}

${knowledgeContext.projects?.length > 0 ? `
🚀 DỰ ÁN & HOẠT ĐỘNG:
${knowledgeContext.projects.slice(0, 3).map((p: any) => `- ${p.name}: ${p.description || 'Dự án đang triển khai'}
  Phụ trách: ${p.assignee} | Trạng thái: ${p.status}`).join('\n')}
` : ''}

${knowledgeContext.importantDocuments?.length > 0 ? `
📋 TÀI LIỆU QUAN TRỌNG:
${knowledgeContext.importantDocuments.map((d: any) => `- ${d.title}: ${d.description || 'Tài liệu thiết yếu cho học viên'}`).join('\n')}
` : ''}

NHIỆM VỤ: Dựa trên thông tin trên, hãy trả lời câu hỏi của học viên một cách chính xác, chi tiết và hữu ích nhất.
Nếu câu hỏi liên quan đến FAQ, hãy sử dụng chính xác câu trả lời từ FAQ.
Nếu có bài viết liên quan, hãy tham khảo và tóm tắt thông tin quan trọng.`;

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