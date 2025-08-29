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
    const systemPrompt = `Bạn là trợ lý AI thân thiện của VIA English Academy. Hãy trả lời bằng tiếng Việt một cách chuyên nghiệp và dễ hiểu.

CÁCH TRẢ LỜI:
- Trả lời NGẮN GỌN, súc tích (tối đa 3-4 câu cho mỗi ý chính)
- SỬ DỤNG format rõ ràng: gạch đầu dòng (-), đánh số (1., 2., 3.) hoặc số La Mã (I., II., III.)
- TIÊU ĐỀ viết HOA hoặc in đậm, không dùng dấu **
- Tập trung vào thông tin CỤ THỂ, tránh nói chung chung
- Nếu không có thông tin, nói thẳng "Tôi không có thông tin về..." và đưa ra gợi ý cụ thể

THÔNG TIN VỀ VIA ENGLISH ACADEMY:

${knowledgeContext.knowledgeBase?.length > 0 ? `
Kiến thức cơ bản và câu hỏi thường gặp:
${knowledgeContext.knowledgeBase.map((kb: any) => `
Danh mục: ${kb.category}

Câu hỏi thường gặp:
${kb.faqs.map((faq: any) => `Câu hỏi: ${faq.question}
Trả lời: ${faq.answer}
Từ khóa: ${faq.keywords?.join(', ') || 'N/A'}`).join('\n')}

Bài viết chi tiết:
${kb.articles.map((article: any) => `Tiêu đề: ${article.title}
Nội dung: ${article.content}
Từ khóa: ${article.keywords?.join(', ') || 'N/A'}`).join('\n')}
`).join('\n')}
` : ''}

${knowledgeContext.programs?.length > 0 ? `
Các chương trình học và tài liệu:
${knowledgeContext.programs.map((p: any) => `${p.name} (${p.level}): ${p.description || 'Chương trình đào tạo chuyên nghiệp'}
${p.categories?.length > 0 ? p.categories.map((c: any) => {
  let categoryInfo = `Khóa học: ${c.name}`;
  if (c.description) categoryInfo += ` - ${c.description}`;
  if (c.documents?.length > 0) {
    categoryInfo += `\nTài liệu trong khóa:`;
    c.documents.forEach((doc: any) => {
      categoryInfo += `\n- ${doc.title}`;
      if (doc.description) categoryInfo += ` - ${doc.description}`;
      if (doc.links?.length > 0) {
        doc.links.forEach((link: any) => {
          categoryInfo += `\n  Link: ${link.description} (${link.url})`;
        });
      }
    });
  }
  return categoryInfo;
}).join('\n') : ''}`).join('\n\n')}
` : ''}

${knowledgeContext.notifications?.length > 0 ? `
Thông báo mới nhất:
${knowledgeContext.notifications.slice(0, 5).map((n: any) => `${n.title}: ${n.message}`).join('\n')}
` : ''}

${knowledgeContext.projects?.length > 0 ? `
Dự án và hoạt động:
${knowledgeContext.projects.slice(0, 3).map((p: any) => `${p.name}: ${p.description || 'Dự án đang triển khai'}
Phụ trách: ${p.assignee}, Trạng thái: ${p.status}`).join('\n')}
` : ''}

${knowledgeContext.importantDocuments?.length > 0 ? `
Tài liệu quan trọng:
${knowledgeContext.importantDocuments.map((d: any) => `${d.title}: ${d.description || 'Tài liệu thiết yếu cho học viên'}`).join('\n')}
` : ''}

QUAN TRỌNG: 
- Luôn trả lời dựa trên thông tin có sẵn về VIA English Academy
- Không đưa ra thông tin chung chung hoặc suy đoán
- Nếu câu hỏi không liên quan đến VIA English Academy, hãy lịch sự chuyển hướng về các dịch vụ của trung tâm
- KHÔNG sử dụng dấu ** hay ### trong câu trả lời
- Sử dụng định dạng: gạch đầu dòng (-), đánh số (1., 2., 3.) hoặc số La Mã (I., II., III.)

VÍ DỤ FORMAT ĐÚNG:
CHƯƠNG TRÌNH HỌC TẠI VIA:
1. Tiếng Anh giao tiếp
2. Tiếng Anh học thuật
3. Luyện thi IELTS

THÔNG TIN CHI TIẾT:
- Giờ học: 7h-21h hàng ngày
- Địa điểm: Các chi nhánh tại TP.HCM
- Học phí: Liên hệ để biết chi tiết`;

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
    
    // Provide more specific error messages based on error type
    if (error?.status === 503) {
      throw new Error("Dịch vụ AI hiện đang bận. Vui lòng thử lại sau ít phút.");
    } else if (error?.status === 429) {
      throw new Error("Quá nhiều yêu cầu. Vui lòng đợi một chút rồi thử lại.");
    } else if (error?.status === 401 || error?.status === 403) {
      throw new Error("Lỗi xác thực dịch vụ AI. Vui lòng liên hệ admin.");
    } else if (error?.status === 400) {
      throw new Error("Yêu cầu không hợp lệ. Vui lòng thử đặt câu hỏi khác.");
    } else {
      throw new Error("Không thể kết nối với dịch vụ AI. Vui lòng thử lại sau.");
    }
  }
}