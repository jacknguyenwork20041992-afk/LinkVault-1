import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertProgramSchema,
  insertCategorySchema,
  insertDocumentSchema,
  insertNotificationSchema,
  insertActivitySchema,
  insertProjectSchema,
  insertImportantDocumentSchema,
  insertAccountSchema,
  insertChatConversationSchema,
  insertChatMessageSchema,
  createUserSchema,
} from "@shared/schema";
import { chatWithAI } from "./openai";
import { z } from "zod";

// Demo chat responses when OpenAI is unavailable
function getDemoResponse(message: string, knowledgeContext: any): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("chào") || lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return "Chào bạn! Tôi là trợ lý AI của VIA English Academy. Tôi có thể giúp bạn tìm hiểu về các chương trình học, tài liệu, và thông báo. Bạn muốn hỏi về điều gì?";
  }
  
  if (lowerMessage.includes("chương trình") || lowerMessage.includes("khóa học") || lowerMessage.includes("program")) {
    const programs = knowledgeContext.programs || [];
    if (programs.length > 0) {
      const programList = programs.map((p: any) => `• ${p.name} (${p.level}) - ${p.description}`).join('\n');
      return `Hiện tại VIA English Academy có các chương trình học sau:\n\n${programList}\n\nBạn muốn tìm hiểu chi tiết về chương trình nào?`;
    }
    return "VIA English Academy có nhiều chương trình học đa dạng từ cơ bản đến nâng cao. Bạn có thể xem chi tiết trong danh sách chương trình của trung tâm.";
  }
  
  if (lowerMessage.includes("tài liệu") || lowerMessage.includes("document") || lowerMessage.includes("file")) {
    return "Trung tâm có rất nhiều tài liệu học tập phong phú bao gồm:\n• Tài liệu giảng dạy chính khóa\n• Bài tập thực hành\n• Tài liệu tham khảo\n• Đề thi mẫu\n\nBạn có thể tìm thấy tất cả trong mục 'Tài liệu' của hệ thống.";
  }
  
  if (lowerMessage.includes("thông báo") || lowerMessage.includes("notification") || lowerMessage.includes("tin tức")) {
    const notifications = knowledgeContext.notifications || [];
    if (notifications.length > 0) {
      return "Có một số thông báo mới từ trung tâm. Bạn có thể xem chi tiết trong mục 'Thông báo' để cập nhật thông tin mới nhất.";
    }
    return "Hiện tại không có thông báo mới. Hãy theo dõi thường xuyên để không bỏ lỡ thông tin quan trọng!";
  }
  
  if (lowerMessage.includes("liên hệ") || lowerMessage.includes("contact") || lowerMessage.includes("hỗ trợ")) {
    return "Nếu bạn cần hỗ trợ thêm, vui lòng:\n• Sử dụng nút 'Hỗ trợ' ở góc màn hình\n• Liên hệ trực tiếp với giáo viên\n• Gửi email cho bộ phận hỗ trợ\n\nChúng tôi luôn sẵn sàng giúp đỡ bạn!";
  }
  
  if (lowerMessage.includes("cảm ơn") || lowerMessage.includes("thanks") || lowerMessage.includes("thank you")) {
    return "Không có gì! Tôi luôn sẵn sàng hỗ trợ bạn. Nếu có câu hỏi khác, đừng ngại hỏi nhé! 😊";
  }
  
  // Default response
  return `Tôi hiểu bạn đang hỏi về "${message}". Tôi có thể giúp bạn tìm hiểu về:\n\n• Chương trình học và khóa học\n• Tài liệu học tập\n• Thông báo mới từ trung tâm\n• Thông tin liên hệ và hỗ trợ\n\nBạn muốn hỏi về chủ đề nào cụ thể hơn không?`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup multiple authentication methods
  const { setupAuth: setupLocalAuth, isAuthenticated, isAdmin } = await import("./auth");
  const { setupGoogleAuth } = await import("./googleAuth");
  
  setupLocalAuth(app);
  setupGoogleAuth(app);

  // Standard auth route (compatible with frontend)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Program routes
  app.get("/api/programs", isAuthenticated, async (req, res) => {
    try {
      const programs = await storage.getAllPrograms();
      res.json(programs);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ message: "Failed to fetch programs" });
    }
  });

  app.get("/api/programs/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const program = await storage.getProgram(id);
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      res.json(program);
    } catch (error) {
      console.error("Error fetching program:", error);
      res.status(500).json({ message: "Failed to fetch program" });
    }
  });

  app.post("/api/programs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertProgramSchema.parse(req.body);
      const program = await storage.createProgram(validatedData);
      res.json(program);
    } catch (error) {
      console.error("Error creating program:", error);
      res.status(400).json({ message: "Failed to create program" });
    }
  });

  app.put("/api/programs/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertProgramSchema.partial().parse(req.body);
      const program = await storage.updateProgram(id, validatedData);
      res.json(program);
    } catch (error) {
      console.error("Error updating program:", error);
      res.status(400).json({ message: "Failed to update program" });
    }
  });

  app.delete("/api/programs/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProgram(id);
      res.json({ message: "Program deleted successfully" });
    } catch (error) {
      console.error("Error deleting program:", error);
      res.status(500).json({ message: "Failed to delete program" });
    }
  });

  // Category routes
  app.get("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/programs/:programId/categories", isAuthenticated, async (req, res) => {
    try {
      const { programId } = req.params;
      const categories = await storage.getCategoriesByProgram(programId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(400).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCategory(id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Document routes
  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/recent", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const documents = await storage.getRecentDocuments(limit);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching recent documents:", error);
      res.status(500).json({ message: "Failed to fetch recent documents" });
    }
  });

  app.get("/api/categories/:categoryId/documents", isAuthenticated, async (req, res) => {
    try {
      const { categoryId } = req.params;
      const documents = await storage.getDocumentsByCategory(categoryId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/programs/:programId/documents", isAuthenticated, async (req, res) => {
    try {
      const { programId } = req.params;
      const documents = await storage.getDocumentsByProgram(programId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(validatedData);
      res.json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(400).json({ message: "Failed to create document" });
    }
  });

  app.post("/api/documents/bulk", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { documents } = req.body;
      if (!Array.isArray(documents) || documents.length === 0) {
        return res.status(400).json({ message: "Documents array is required" });
      }
      
      const validatedDocuments = documents.map(doc => insertDocumentSchema.parse(doc));
      const createdDocuments = await storage.createDocuments(validatedDocuments);
      res.json(createdDocuments);
    } catch (error) {
      console.error("Error creating bulk documents:", error);
      res.status(400).json({ message: "Failed to create documents" });
    }
  });

  // Bulk create categories
  app.post("/api/categories/bulk", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { categories } = req.body;
      if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({ message: "Categories array is required" });
      }
      
      const validatedCategories = categories.map(cat => insertCategorySchema.parse(cat));
      const createdCategories = await storage.createCategories(validatedCategories);
      res.json(createdCategories);
    } catch (error) {
      console.error("Error creating bulk categories:", error);
      res.status(400).json({ message: "Failed to create categories" });
    }
  });

  app.put("/api/documents/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDocument(id, validatedData);
      res.json(document);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(400).json({ message: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDocument(id);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // User management routes (admin only)
  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const user = await storage.updateUser(id, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const result = await storage.getNotificationsForUser(userId);
      res.json(result.notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await storage.getNotificationsForUser(userId, page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getUnreadNotificationsForUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  app.post("/api/notifications", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(400).json({ message: "Failed to create notification" });
    }
  });

  app.put("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      await storage.markNotificationAsRead(userId, id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Activity routes
  app.get("/api/activities", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const activities = await storage.getAllActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/recent", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });

  app.post("/api/activities/track", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const activityData = {
        ...req.body,
        userId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      };
      const validatedData = insertActivitySchema.parse(activityData);
      const activity = await storage.createActivity(validatedData);
      res.json(activity);
    } catch (error) {
      console.error("Error tracking activity:", error);
      res.status(400).json({ message: "Failed to track activity" });
    }
  });

  app.post("/api/activities/login", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = req.user;
      await storage.createActivity({
        userId,
        type: "login",
        description: `Người dùng ${user.firstName} ${user.lastName} đã đăng nhập`,
        metadata: {
          email: user.email,
          role: user.role,
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      });
      res.json({ message: "Login activity logged" });
    } catch (error) {
      console.error("Error logging login activity:", error);
      res.status(500).json({ message: "Failed to log login activity" });
    }
  });

  // Project routes
  app.get("/api/projects", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, validatedData);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Important documents routes
  app.get("/api/important-documents", isAuthenticated, async (req, res) => {
    try {
      const importantDocuments = await storage.getAllImportantDocuments();
      res.json(importantDocuments);
    } catch (error) {
      console.error("Error fetching important documents:", error);
      res.status(500).json({ message: "Failed to fetch important documents" });
    }
  });

  app.get("/api/important-documents/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const importantDocument = await storage.getImportantDocument(id);
      if (!importantDocument) {
        return res.status(404).json({ message: "Important document not found" });
      }
      res.json(importantDocument);
    } catch (error) {
      console.error("Error fetching important document:", error);
      res.status(500).json({ message: "Failed to fetch important document" });
    }
  });

  app.post("/api/important-documents", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertImportantDocumentSchema.parse(req.body);
      const importantDocument = await storage.createImportantDocument(validatedData);
      res.json(importantDocument);
    } catch (error) {
      console.error("Error creating important document:", error);
      res.status(400).json({ message: "Failed to create important document" });
    }
  });

  app.put("/api/important-documents/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertImportantDocumentSchema.partial().parse(req.body);
      const importantDocument = await storage.updateImportantDocument(id, validatedData);
      res.json(importantDocument);
    } catch (error) {
      console.error("Error updating important document:", error);
      res.status(400).json({ message: "Failed to update important document" });
    }
  });

  app.delete("/api/important-documents/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteImportantDocument(id);
      res.json({ message: "Important document deleted successfully" });
    } catch (error) {
      console.error("Error deleting important document:", error);
      res.status(500).json({ message: "Failed to delete important document" });
    }
  });

  // Accounts routes
  app.get("/api/accounts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const accounts = await storage.getAllAccounts();
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post("/api/accounts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(validatedData);
      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(400).json({ message: "Failed to create account" });
    }
  });

  app.put("/api/accounts/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(id, validatedData);
      res.json(account);
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(400).json({ message: "Failed to update account" });
    }
  });

  app.delete("/api/accounts/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAccount(id);
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Public registration route  
  app.post("/api/register", async (req: any, res) => {
    try {
      const userData = createUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Auto-login after registration
      req.logIn(user, (err: any) => {
        if (err) {
          console.error("Auto-login error:", err);
          return res.status(201).json(user);
        }
        res.status(201).json(user);
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      if (error.code === "23505") { // Unique violation
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Admin stats
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Chat routes
  app.get("/api/chat/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getChatConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/chat/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const conversation = await storage.getChatConversation(id, userId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post("/api/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { message, conversationId } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }

      let conversation;
      
      if (conversationId) {
        // Get existing conversation
        conversation = await storage.getChatConversation(conversationId, userId);
        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }
      } else {
        // Create new conversation
        const conversationData = insertChatConversationSchema.parse({
          userId,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : "")
        });
        conversation = await storage.createChatConversation(conversationData);
      }

      // Save user message
      await storage.createChatMessage({
        conversationId: conversation.id,
        role: "user",
        content: message
      });

      // Get knowledge context
      const knowledgeContext = await storage.getKnowledgeContext();
      
      // Get conversation history for context
      const conversationHistory = (conversationId && conversation && 'messages' in conversation ? conversation.messages : []).map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }));

      // Get AI response - Demo mode with predefined responses
      let aiResponse: string;
      try {
        aiResponse = await chatWithAI(message, knowledgeContext, conversationHistory);
      } catch (error) {
        console.log("Using demo responses due to OpenAI error:", error.message);
        aiResponse = getDemoResponse(message, knowledgeContext);
      }

      // Save AI message
      const aiMessage = await storage.createChatMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: aiResponse
      });

      res.json({
        message: aiMessage,
        conversationId: conversation.id
      });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ message: "Chat failed. Please try again." });
    }
  });

  app.delete("/api/chat/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      await storage.deleteChatConversation(id, userId);
      res.json({ message: "Conversation deleted" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
