import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface KnowledgeContext {
  programs: Array<{
    name: string;
    description?: string;
    level: string;
    categories: Array<{
      name: string;
      description?: string;
      documents: Array<{
        title: string;
        description?: string;
        links: Array<{url: string; description: string}>;
      }>;
    }>;
  }>;
  notifications: Array<{
    title: string;
    message: string;
    createdAt: string;
  }>;
  projects: Array<{
    name: string;
    description?: string;
    assignee: string;
    status: string;
    deadline: string;
  }>;
  importantDocuments: Array<{
    title: string;
    description?: string;
    url: string;
  }>;
}

function buildKnowledgePrompt(context: KnowledgeContext): string {
  let prompt = `Bạn là trợ lý AI của VIA ENGLISH ACADEMY - trung tâm tiếng Anh. Hãy trả lời câu hỏi bằng tiếng Việt dựa trên thông tin sau:\n\n`;

  // Programs and documents
  if (context.programs.length > 0) {
    prompt += "**CHƯƠNG TRÌNH HỌC:**\n";
    context.programs.forEach(program => {
      prompt += `- ${program.name} (${program.level})`;
      if (program.description) prompt += `: ${program.description}`;
      prompt += "\n";
      
      if (program.categories.length > 0) {
        program.categories.forEach(category => {
          prompt += `  + Khóa học: ${category.name}`;
          if (category.description) prompt += ` - ${category.description}`;
          prompt += "\n";
          
          if (category.documents.length > 0) {
            category.documents.forEach(doc => {
              prompt += `    * Tài liệu: ${doc.title}`;
              if (doc.description) prompt += ` - ${doc.description}`;
              prompt += "\n";
              doc.links.forEach(link => {
                prompt += `      Link: ${link.description} (${link.url})\n`;
              });
            });
          }
        });
      }
    });
    prompt += "\n";
  }

  // Important documents
  if (context.importantDocuments.length > 0) {
    prompt += "**TÀI LIỆU QUAN TRỌNG:**\n";
    context.importantDocuments.forEach(doc => {
      prompt += `- ${doc.title}`;
      if (doc.description) prompt += `: ${doc.description}`;
      prompt += ` (${doc.url})\n`;
    });
    prompt += "\n";
  }

  // Recent notifications
  if (context.notifications.length > 0) {
    prompt += "**THÔNG BÁO GẦN ĐÂY:**\n";
    context.notifications.slice(0, 5).forEach(notif => {
      const date = new Date(notif.createdAt).toLocaleDateString('vi-VN');
      prompt += `- ${notif.title} (${date}): ${notif.message}\n`;
    });
    prompt += "\n";
  }

  // Projects
  if (context.projects.length > 0) {
    prompt += "**DỰ ÁN HIỆN TẠI:**\n";
    context.projects.slice(0, 5).forEach(project => {
      const deadline = new Date(project.deadline).toLocaleDateString('vi-VN');
      prompt += `- ${project.name} (${project.status}) - Phụ trách: ${project.assignee} - Hạn: ${deadline}`;
      if (project.description) prompt += ` - ${project.description}`;
      prompt += "\n";
    });
    prompt += "\n";
  }

  prompt += `

CÁCH TRẢ LỜI:
- Trả lời NGẮN GỌN, súc tích (tối đa 3-4 câu cho mỗi ý)
- SỬ DỤNG format rõ ràng: gạch đầu dòng (-), đánh số (1., 2., 3.) hoặc số La Mã (I., II., III.)
- TIÊU ĐỀ viết HOA hoặc in đậm, KHÔNG dùng dấu ** hay ###
- Tập trung vào thông tin CỤ THỂ về VIA English Academy
- Nếu không có thông tin, nói thẳng "Tôi không có thông tin về..." và gợi ý liên hệ admin

QUAN TRỌNG: 
- Chỉ trả lời về VIA English Academy
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

  return prompt;
}

export async function chatWithAI(
  message: string, 
  context: KnowledgeContext,
  conversationHistory: Array<{role: "user" | "assistant", content: string}> = []
): Promise<string> {
  try {
    const systemPrompt = buildKnowledgePrompt(context);
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using gpt-4o as it's more widely available than gpt-5
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Xin lỗi, tôi không thể trả lời câu hỏi này lúc này.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Không thể kết nối với dịch vụ AI. Vui lòng thử lại sau.");
  }
}