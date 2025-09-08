import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
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
  insertKnowledgeCategorySchema,
  insertKnowledgeArticleSchema,
  insertFaqItemSchema,
  insertTrainingFileSchema,
  insertSupportTicketSchema,
  insertSupportResponseSchema,
  insertAccountRequestSchema,
  insertThemeSettingSchema,
  insertAdminUserChatSchema,
  insertAdminUserMessageSchema,
  insertOnlineUserSchema,
  createUserSchema,
} from "@shared/schema";
import { chatWithAI } from "./openai";
import { chatWithGeminiAI } from "./gemini";
import { TextExtractor } from "./textExtractor";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { sendEmail, generateAccountRequestEmail } from "./emailService";
import { z } from "zod";

// Demo chat responses when OpenAI is unavailable
function getDemoResponse(message: string, knowledgeContext: any): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("chào") || lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return "Chào bạn! Tôi là trợ lý AI của VIA R&D Department. Tôi có thể giúp bạn tìm hiểu về các chương trình học, tài liệu, và thông báo. Bạn muốn hỏi về điều gì?";
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
  // Health check endpoint - FIRST to avoid Vite override
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || "development"
    });
  });

  // Setup multiple authentication methods
  const { setupAuth: setupLocalAuth, isAuthenticated, isAdmin } = await import("./auth");
  const { setupGoogleAuth } = await import("./googleAuth");
  
  setupLocalAuth(app);
  setupGoogleAuth(app);

  // Serve support ticket images via API endpoint
  app.get("/api/support-images/:imageId", isAuthenticated, async (req, res) => {
    console.log("🖼️ IMAGE REQUEST:", req.params.imageId);
    try {
      const objectStorageService = new ObjectStorageService();
      const imagePath = `/objects/uploads/${req.params.imageId}`;
      const objectFile = await objectStorageService.getObjectEntityFile(imagePath);
      
      console.log("🖼️ Serving image...");
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("❌ Image error:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Image not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit (increased from 50MB)
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Unsupported file type'));
      }
    }
  });

  // Standard auth route (compatible with frontend)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Alias route for frontend compatibility
  app.get('/api/user', isAuthenticated, async (req: any, res) => {
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

  app.put("/api/users/:id/toggle-active", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean value" });
      }
      
      const user = await storage.toggleUserActive(id, isActive);
      res.json(user);
    } catch (error) {
      console.error("Error toggling user active status:", error);
      res.status(500).json({ message: "Failed to update user status" });
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
      const messages = conversationId && conversation && 'messages' in conversation ? conversation.messages || [] : [];
      const conversationHistory = (Array.isArray(messages) ? messages : []).map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }));

      // Get AI response - Try Gemini first, fallback to demo if needed
      let aiResponse: string;
      try {
        aiResponse = await chatWithGeminiAI(message, knowledgeContext, conversationHistory);
      } catch (error) {
        console.log("Using demo responses due to Gemini error:", (error as Error).message);
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

  // Simple rate limiting store for public chat
  const publicChatRateLimit = new Map<string, { count: number; lastReset: number }>();
  const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per hour
  const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

  const checkRateLimit = (ip: string): boolean => {
    const now = Date.now();
    const userLimit = publicChatRateLimit.get(ip);
    
    if (!userLimit || now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
      // Reset or create new limit
      publicChatRateLimit.set(ip, { count: 1, lastReset: now });
      return true;
    }
    
    if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
      return false; // Rate limit exceeded
    }
    
    userLimit.count++;
    return true;
  };

  // Public AI Chat endpoint (no authentication required)
  app.post("/api/public-chat", async (req, res) => {
    try {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Check rate limit
      if (!checkRateLimit(clientIP)) {
        return res.status(429).json({ 
          message: "Quá nhiều yêu cầu. Vui lòng thử lại sau 1 giờ.",
          error: "RATE_LIMIT_EXCEEDED"
        });
      }

      const { message } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }

      if (message.length > 1000) {
        return res.status(400).json({ message: "Message quá dài. Tối đa 1000 ký tự." });
      }

      // Get knowledge context
      const knowledgeContext = await storage.getKnowledgeContext();
      
      // For public chat, no conversation history - just single message
      const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

      // Get AI response - Try Gemini first, fallback to demo if needed
      let aiResponse: string;
      try {
        aiResponse = await chatWithGeminiAI(message, knowledgeContext, conversationHistory);
      } catch (error) {
        console.log("Using demo responses due to Gemini error:", (error as Error).message);
        aiResponse = getDemoResponse(message, knowledgeContext);
      }

      res.json({
        message: aiResponse,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error in public chat:", error);
      res.status(500).json({ message: "Chat failed. Please try again." });
    }
  });

  // Knowledge Base Admin Routes
  // Knowledge Categories
  app.get("/api/knowledge/categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categories = await storage.getAllKnowledgeCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching knowledge categories:", error);
      res.status(500).json({ message: "Failed to fetch knowledge categories" });
    }
  });

  app.post("/api/knowledge/categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categoryData = insertKnowledgeCategorySchema.parse(req.body);
      const category = await storage.createKnowledgeCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating knowledge category:", error);
      res.status(500).json({ message: "Failed to create knowledge category" });
    }
  });

  app.put("/api/knowledge/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const categoryData = insertKnowledgeCategorySchema.partial().parse(req.body);
      const category = await storage.updateKnowledgeCategory(id, categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error updating knowledge category:", error);
      res.status(500).json({ message: "Failed to update knowledge category" });
    }
  });

  app.delete("/api/knowledge/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteKnowledgeCategory(id);
      res.json({ message: "Knowledge category deleted" });
    } catch (error) {
      console.error("Error deleting knowledge category:", error);
      res.status(500).json({ message: "Failed to delete knowledge category" });
    }
  });

  // Knowledge Articles
  app.get("/api/knowledge/articles", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const articles = await storage.getAllKnowledgeArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching knowledge articles:", error);
      res.status(500).json({ message: "Failed to fetch knowledge articles" });
    }
  });

  app.post("/api/knowledge/articles", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const articleData = insertKnowledgeArticleSchema.parse(req.body);
      const article = await storage.createKnowledgeArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      console.error("Error creating knowledge article:", error);
      res.status(500).json({ message: "Failed to create knowledge article" });
    }
  });

  app.put("/api/knowledge/articles/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const articleData = insertKnowledgeArticleSchema.partial().parse(req.body);
      const article = await storage.updateKnowledgeArticle(id, articleData);
      res.json(article);
    } catch (error) {
      console.error("Error updating knowledge article:", error);
      res.status(500).json({ message: "Failed to update knowledge article" });
    }
  });

  app.delete("/api/knowledge/articles/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteKnowledgeArticle(id);
      res.json({ message: "Knowledge article deleted" });
    } catch (error) {
      console.error("Error deleting knowledge article:", error);
      res.status(500).json({ message: "Failed to delete knowledge article" });
    }
  });

  // FAQ Items
  app.get("/api/knowledge/faqs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const faqs = await storage.getAllFaqItems();
      res.json(faqs);
    } catch (error) {
      console.error("Error fetching FAQ items:", error);
      res.status(500).json({ message: "Failed to fetch FAQ items" });
    }
  });

  app.post("/api/knowledge/faqs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const faqData = insertFaqItemSchema.parse(req.body);
      const faq = await storage.createFaqItem(faqData);
      res.status(201).json(faq);
    } catch (error) {
      console.error("Error creating FAQ item:", error);
      res.status(500).json({ message: "Failed to create FAQ item" });
    }
  });

  app.put("/api/knowledge/faqs/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const faqData = insertFaqItemSchema.partial().parse(req.body);
      const faq = await storage.updateFaqItem(id, faqData);
      res.json(faq);
    } catch (error) {
      console.error("Error updating FAQ item:", error);
      res.status(500).json({ message: "Failed to update FAQ item" });
    }
  });

  app.delete("/api/knowledge/faqs/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFaqItem(id);
      res.json({ message: "FAQ item deleted" });
    } catch (error) {
      console.error("Error deleting FAQ item:", error);
      res.status(500).json({ message: "Failed to delete FAQ item" });
    }
  });

  // Knowledge Base Search (for users too)
  app.get("/api/knowledge/search", isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }
      const results = await storage.searchKnowledgeBase(q);
      res.json(results);
    } catch (error) {
      console.error("Error searching knowledge base:", error);
      res.status(500).json({ message: "Failed to search knowledge base" });
    }
  });

  // Object Storage Routes
  // Upload URL endpoint
  // Cloudinary upload routes
  app.post("/api/upload/image", isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      console.log("🖼️ IMAGE UPLOAD REQUEST:", req.file?.originalname);
      console.log("🔐 User authenticated:", req.user ? 'YES' : 'NO');
      
      if (!req.file) {
        console.error("❌ No image file provided");
        return res.status(400).json({ error: "No image file provided" });
      }

      console.log("📦 File details:", {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      });

      const { cloudinaryService } = await import('./cloudinaryService');
      console.log("☁️ Uploading to Cloudinary...");
      
      const imageUrl = await cloudinaryService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        'support-tickets'
      );

      console.log("✅ Upload successful:", imageUrl);
      res.json({ imageUrl });
    } catch (error) {
      console.error("❌ Error uploading image:", error);
      res.status(500).json({ 
        error: "Failed to upload image",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/upload/file", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      console.log("📁 FILE UPLOAD REQUEST:", req.file?.originalname);
      console.log("🔐 User authenticated:", req.user ? 'YES' : 'NO');
      
      if (!req.file) {
        console.error("❌ No file provided");
        return res.status(400).json({ error: "No file provided" });
      }

      console.log("📦 File details:", {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      });

      const { cloudinaryService } = await import('./cloudinaryService');
      console.log("☁️ Uploading to Cloudinary...");
      
      const fileUrl = await cloudinaryService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        'account-requests'
      );

      console.log("✅ Upload successful:", fileUrl);
      res.json({ fileUrl });
    } catch (error) {
      console.error("❌ Error uploading file:", error);
      res.status(500).json({ 
        error: "Failed to upload file",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Training Files Routes
  // Upload and process training file directly
  app.post("/api/training-files/upload", isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const { description } = req.body;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const user = req.user as any;
      const textExtractor = new TextExtractor();
      
      // Get file info
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || '';
      const fileType = fileExtension;
      
      // Create training file record with processing status
      const trainingFile = await storage.createTrainingFile({
        filename: `${Date.now()}-${file.originalname}`,
        originalName: file.originalname,
        fileType,
        fileSize: file.size,
        objectPath: '', // No object storage path for direct upload
        status: "processing",
        uploadedBy: user.id,
        metadata: {
          description: description || null,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Process file in background
      setImmediate(async () => {
        try {
          // Extract text from file buffer
          const extractedText = await textExtractor.extractText(file.buffer, file.originalname);
          
          // Update training file with extracted content
          await storage.updateTrainingFile(trainingFile.id, {
            extractedContent: extractedText.content,
            status: "completed",
            metadata: {
              ...(trainingFile.metadata || {}),
              extractionMetadata: extractedText.metadata,
              processedAt: new Date().toISOString(),
            },
          });

          console.log(`Successfully processed training file: ${file.originalname}`);
          
          // Automatically convert to knowledge base article if extraction was successful
          try {
            if (extractedText.content && extractedText.content.trim() !== '') {
              const knowledgeArticle = await storage.convertTrainingFileToKnowledgeBase(trainingFile.id);
              console.log(`Auto-converted training file to knowledge article: ${knowledgeArticle.title}`);
            }
          } catch (conversionError) {
            const errorMessage = conversionError instanceof Error ? conversionError.message : 'Unknown error';
            console.log(`Note: Could not auto-convert to knowledge base: ${errorMessage}`);
            // Don't fail the whole process, just log the conversion error
          }
        } catch (error) {
          console.error(`Error processing training file ${file.originalname}:`, error);
          
          // Update status to failed
          await storage.updateTrainingFile(trainingFile.id, {
            status: "failed",
            metadata: {
              ...(trainingFile.metadata || {}),
              error: error instanceof Error ? error.message : 'Unknown error',
              failedAt: new Date().toISOString(),
            },
          });
        }
      });

      res.json({ 
        message: "File uploaded successfully and is being processed",
        fileId: trainingFile.id 
      });
    } catch (error) {
      console.error("Error uploading training file:", error);
      res.status(500).json({ message: "Failed to upload training file" });
    }
  });

  // Get all training files
  app.get("/api/training-files", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const files = await storage.getAllTrainingFiles();
      res.json(files);
    } catch (error) {
      console.error("Error fetching training files:", error);
      res.status(500).json({ message: "Failed to fetch training files" });
    }
  });

  // Process uploaded file for training
  app.post("/api/training-files/process", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { uploadURL, originalName, description } = req.body;
      
      if (!uploadURL || !originalName) {
        return res.status(400).json({ message: "Upload URL and original name are required" });
      }

      const user = req.user as any;
      const objectStorageService = new ObjectStorageService();
      const textExtractor = new TextExtractor();

      // Normalize the object path
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      
      // Get file info
      const fileExtension = originalName.split('.').pop()?.toLowerCase() || '';
      const fileType = fileExtension;
      
      // Create training file record with processing status
      const trainingFile = await storage.createTrainingFile({
        filename: `${Date.now()}-${originalName}`,
        originalName,
        fileType,
        fileSize: 0, // Will be updated after download
        objectPath,
        status: "processing",
        uploadedBy: user.id,
        metadata: {
          description: description || null,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Process file in background
      setTimeout(async () => {
        try {
          // Download file from object storage
          const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
          const [metadata] = await objectFile.getMetadata();
          
          // Download file content
          const chunks: Buffer[] = [];
          const stream = objectFile.createReadStream();
          
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          
          const fileBuffer = Buffer.concat(chunks);
          
          // Extract text from file
          const extractedData = await textExtractor.extractText(fileBuffer, originalName);
          const cleanedContent = textExtractor.cleanText(extractedData.content);
          
          // Update training file with extracted content
          await storage.updateTrainingFile(trainingFile.id, {
            extractedContent: cleanedContent,
            fileSize: parseInt(String(metadata.size || '0')),
            status: "completed",
            metadata: {
              ...(trainingFile.metadata || {}),
              ...(extractedData.metadata || {}),
              extractedAt: new Date().toISOString(),
            },
          });

          console.log(`Successfully processed training file: ${originalName}`);
          
          // Automatically convert to knowledge base article if extraction was successful
          try {
            if (cleanedContent && cleanedContent.trim() !== '') {
              const knowledgeArticle = await storage.convertTrainingFileToKnowledgeBase(trainingFile.id);
              console.log(`Auto-converted training file to knowledge article: ${knowledgeArticle.title}`);
            }
          } catch (conversionError) {
            console.log(`Note: Could not auto-convert to knowledge base: ${(conversionError as Error).message}`);
            // Don't fail the whole process, just log the conversion error
          }
          
        } catch (error) {
          console.error("Error processing training file:", error);
          await storage.updateTrainingFile(trainingFile.id, {
            status: "failed",
            metadata: {
              ...(trainingFile.metadata || {}),
              error: (error as Error).message,
              failedAt: new Date().toISOString(),
            },
          });
        }
      }, 1000); // Small delay to ensure upload is complete

      res.status(201).json({
        id: trainingFile.id,
        message: "File upload received and processing started",
        objectPath,
      });
      
    } catch (error) {
      console.error("Error processing training file:", error);
      res.status(500).json({ message: "Failed to process training file" });
    }
  });

  // Delete training file
  app.delete("/api/training-files/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTrainingFile(id);
      res.json({ message: "Training file deleted" });
    } catch (error) {
      console.error("Error deleting training file:", error);
      res.status(500).json({ message: "Failed to delete training file" });
    }
  });

  // Re-process failed training file
  app.post("/api/training-files/:id/reprocess", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const trainingFile = await storage.getTrainingFile(id);
      
      if (!trainingFile) {
        return res.status(404).json({ message: "Training file not found" });
      }

      const objectStorageService = new ObjectStorageService();
      const textExtractor = new TextExtractor();

      // Set status to processing
      await storage.updateTrainingFile(id, { status: "processing" });

      // Process file
      setTimeout(async () => {
        try {
          const objectFile = await objectStorageService.getObjectEntityFile(trainingFile.objectPath);
          const [metadata] = await objectFile.getMetadata();
          
          const chunks: Buffer[] = [];
          const stream = objectFile.createReadStream();
          
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          
          const fileBuffer = Buffer.concat(chunks);
          const extractedData = await textExtractor.extractText(fileBuffer, trainingFile.originalName);
          const cleanedContent = textExtractor.cleanText(extractedData.content);
          
          await storage.updateTrainingFile(id, {
            extractedContent: cleanedContent,
            fileSize: parseInt(String(metadata.size || '0')),
            status: "completed",
            metadata: {
              ...(trainingFile.metadata || {}),
              ...(extractedData.metadata || {}),
              reprocessedAt: new Date().toISOString(),
            },
          });

          console.log(`Successfully reprocessed training file: ${trainingFile.originalName}`);
          
        } catch (error) {
          console.error("Error reprocessing training file:", error);
          await storage.updateTrainingFile(id, {
            status: "failed",
            metadata: {
              ...(trainingFile.metadata || {}),
              error: (error as Error).message,
              failedAt: new Date().toISOString(),
            },
          });
        }
      }, 1000);

      res.json({ message: "File reprocessing started" });
      
    } catch (error) {
      console.error("Error reprocessing training file:", error);
      res.status(500).json({ message: "Failed to reprocess training file" });
    }
  });

  // Convert training file to knowledge base manually
  app.post("/api/training-files/:id/convert-to-knowledge", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { categoryId } = req.body;
      
      const knowledgeArticle = await storage.convertTrainingFileToKnowledgeBase(id, categoryId);
      res.json({ 
        message: "Training file converted to knowledge base successfully",
        article: knowledgeArticle
      });
    } catch (error) {
      console.error("Error converting training file to knowledge base:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to convert training file" });
    }
  });

  // Support ticket routes
  app.get("/api/support-tickets", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role === "admin") {
        // Admin can see all tickets
        const tickets = await storage.getAllSupportTickets();
        res.json(tickets);
      } else {
        // Users can only see their own tickets
        const tickets = await storage.getSupportTicketsByUser(user.id);
        res.json(tickets);
      }
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  // Admin endpoint for support tickets
  app.get("/api/admin/support-tickets", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const tickets = await storage.getAllSupportTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching admin support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  app.get("/api/support-tickets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const ticket = await storage.getSupportTicket(id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      // Check permissions - admin can see all, users can only see their own
      if (user.role !== "admin" && ticket.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(ticket);
    } catch (error) {
      console.error("Error fetching support ticket:", error);
      res.status(500).json({ message: "Failed to fetch support ticket" });
    }
  });

  app.post("/api/support-tickets", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      // issueDate is already a string from frontend, no conversion needed
      const requestData = { ...req.body };
      console.log("Request data:", requestData);
      
      const ticketData = insertSupportTicketSchema.parse({
        ...requestData,
        userId: user.id,
      });
      
      const ticket = await storage.createSupportTicket(ticketData);
      
      // Set ACL policy for uploaded images if they exist
      if (ticketData.imageUrls && Array.isArray(ticketData.imageUrls)) {
        for (const imageUrl of ticketData.imageUrls) {
          try {
            const objectStorageService = new ObjectStorageService();
            await objectStorageService.trySetObjectEntityAclPolicy(
              imageUrl,
              {
                owner: user.id,
                visibility: "private", // Support ticket images should be private
                aclRules: []
              }
            );
          } catch (error) {
            console.error("Error setting ACL policy for image:", error);
            // Don't fail the ticket creation if ACL setting fails
          }
        }
      }
      
      // Tạo thông báo cho tất cả admin khi có support ticket mới
      const adminUsers = await storage.getUsersByRole("admin");
      for (const admin of adminUsers) {
        await storage.createNotification({
          title: "Yêu cầu hỗ trợ mới",
          message: `${user.firstName} ${user.lastName} đã gửi yêu cầu hỗ trợ từ chi nhánh ${ticketData.branch}. Nội dung: ${ticketData.description}`,
          isGlobal: false,
          recipientId: admin.id,
        });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      if ((error as any).name === "ZodError") {
        res.status(400).json({ message: "Invalid data", errors: (error as any).issues });
      } else {
        res.status(500).json({ message: "Failed to create support ticket" });
      }
    }
  });

  app.put("/api/support-tickets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      const ticket = await storage.getSupportTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      // Only admin can update ticket status and priority
      if (user.role !== "admin" && ticket.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Users can only update their own tickets and only certain fields
      let updateData = req.body;
      if (user.role !== "admin" && ticket.userId === user.id) {
        // Users can only update description and documentLink
        updateData = {
          description: req.body.description,
          documentLink: req.body.documentLink,
          imageUrl: req.body.imageUrl
        };
      }
      
      const updatedTicket = await storage.updateSupportTicket(id, updateData);
      res.json(updatedTicket);
    } catch (error) {
      console.error("Error updating support ticket:", error);
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  });

  app.delete("/api/support-tickets/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSupportTicket(id);
      res.json({ message: "Support ticket deleted" });
    } catch (error) {
      console.error("Error deleting support ticket:", error);
      res.status(500).json({ message: "Failed to delete support ticket" });
    }
  });

  // Support ticket status update (for admin)
  app.put("/api/support-tickets/:id/status", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const ticket = await storage.getSupportTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      const updatedTicket = await storage.updateSupportTicket(id, { status });
      res.json(updatedTicket);
    } catch (error) {
      console.error("Error updating support ticket status:", error);
      res.status(500).json({ message: "Failed to update support ticket status" });
    }
  });

  // Support ticket respond endpoint (for admin)
  app.post("/api/support-tickets/:ticketId/respond", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { ticketId } = req.params;
      const { response } = req.body;
      const user = req.user;
      
      // Check if ticket exists
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      const responseData = insertSupportResponseSchema.parse({
        response,
        ticketId,
        responderId: user.id,
        isInternal: false
      });
      
      const supportResponse = await storage.createSupportResponse(responseData);
      
      // Update ticket status to in_progress if it was open
      if (ticket.status === "open") {
        await storage.updateSupportTicket(ticketId, { status: "in_progress" });
      }
      
      // Tạo thông báo cho user khi admin phản hồi
      const adminName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : "Admin";
      
      const statusText = ticket.status === "open" ? "Đang xử lý" : 
                        ticket.status === "in_progress" ? "Đang xử lý" :
                        ticket.status === "resolved" ? "Đã giải quyết" : "Đã đóng";
      
      await storage.createNotification({
        title: `💬 Phản hồi từ ${adminName}`,
        message: `🏢 Chi nhánh: ${ticket.branch}\n📚 Lớp: ${ticket.classLevel}\n📊 Trạng thái: ${statusText}\n\n💭 Phản hồi: "${response.substring(0, 150)}${response.length > 150 ? '...' : ''}"\n\n👆 Nhấn để xem chi tiết`,
        isGlobal: false,
        recipientId: ticket.userId,
      });
      
      res.json(supportResponse);
    } catch (error) {
      console.error("Error creating support response:", error);
      if ((error as any).name === "ZodError") {
        res.status(400).json({ message: "Invalid data", errors: (error as any).issues });
      } else {
        res.status(500).json({ message: "Failed to create support response" });
      }
    }
  });

  // Get responses for a support ticket
  app.get("/api/support-tickets/:ticketId/responses", isAuthenticated, async (req: any, res) => {
    try {
      const { ticketId } = req.params;
      const user = req.user;
      
      // Check if ticket exists and user has access
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      // Check permissions - admin can see all, users can only see their own
      if (user.role !== "admin" && ticket.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const responses = await storage.getSupportResponses(ticketId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching support responses:", error);
      res.status(500).json({ message: "Failed to fetch support responses" });
    }
  });

  // Convert support ticket to AI training data (for admin only)
  app.post("/api/support-tickets/:ticketId/convert-to-training", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { ticketId } = req.params;
      const { categoryId } = req.body; // Optional category ID
      
      // Convert the support ticket to training data
      const result = await storage.convertSupportTicketToTraining(ticketId, categoryId);
      
      res.json({
        success: true,
        faqId: result.faqId,
        message: result.message
      });
    } catch (error: any) {
      console.error("Error converting support ticket to training data:", error);
      res.status(400).json({ 
        success: false,
        message: (error as Error).message || "Failed to convert support ticket to training data" 
      });
    }
  });

  // Support response routes
  app.post("/api/support-tickets/:ticketId/responses", isAuthenticated, async (req: any, res) => {
    try {
      const { ticketId } = req.params;
      const user = req.user;
      
      // Check if ticket exists
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      // Check permissions - admin can respond, users can only respond to their own tickets
      if (user.role !== "admin" && ticket.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const responseData = insertSupportResponseSchema.parse({
        ...req.body,
        ticketId,
        responderId: user.id,
        isInternal: user.role === "admin" ? req.body.isInternal || false : false
      });
      
      const response = await storage.createSupportResponse(responseData);
      
      // If admin responds, update ticket status to in_progress if it was open
      if (user.role === "admin" && ticket.status === "open") {
        await storage.updateSupportTicket(ticketId, { status: "in_progress" });
      }
      
      // Tạo thông báo cho user khi admin phản hồi (không phải internal note)
      if (user.role === "admin" && !responseData.isInternal && ticket.userId !== user.id) {
        await storage.createNotification({
          title: "Phản hồi mới từ admin",
          message: `Admin đã phản hồi yêu cầu hỗ trợ của bạn: "${responseData.response.substring(0, 100)}${responseData.response.length > 100 ? '...' : ''}"`,
          isGlobal: false,
          recipientId: ticket.userId,
        });
      }
      
      res.json(response);
    } catch (error) {
      console.error("Error creating support response:", error);
      if ((error as any).name === "ZodError") {
        res.status(400).json({ message: "Invalid data", errors: (error as any).issues });
      } else {
        res.status(500).json({ message: "Failed to create support response" });
      }
    }
  });

  // Object storage routes for account requests
  app.post("/api/account-requests/upload-url", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const { requestType, branchName } = req.body;
      
      // Use meaningful filename if both parameters are provided
      const uploadURL = (requestType && branchName) 
        ? await objectStorageService.getObjectEntityUploadURLWithName(requestType, branchName)
        : await objectStorageService.getObjectEntityUploadURL();
        
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Serve account request files (admin only)
  app.get("/objects/:objectPath(*)", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving file:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Account request endpoints
  app.get("/api/account-requests", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.role === "admin") {
        // Admin can see all account requests
        const requests = await storage.getAllAccountRequests();
        res.json(requests);
      } else {
        // Users can only see their own requests
        const requests = await storage.getAccountRequestsByUser(user.id);
        res.json(requests);
      }
    } catch (error) {
      console.error("Error fetching account requests:", error);
      res.status(500).json({ message: "Failed to fetch account requests" });
    }
  });

  // Admin endpoint for account requests
  app.get("/api/admin/account-requests", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const requests = await storage.getAllAccountRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching admin account requests:", error);
      res.status(500).json({ message: "Failed to fetch account requests" });
    }
  });

  app.get("/api/account-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const request = await storage.getAccountRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Account request not found" });
      }

      // Check permissions - admin can see all, users can only see their own
      if (user.role !== "admin" && request.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(request);
    } catch (error) {
      console.error("Error fetching account request:", error);
      res.status(500).json({ message: "Failed to fetch account request" });
    }
  });

  app.post("/api/account-requests", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      const requestData = insertAccountRequestSchema.parse({
        ...req.body,
        userId: user.id,
      });
      
      const accountRequest = await storage.createAccountRequest(requestData);
      
      // Tạo thông báo cho tất cả admin khi có account request mới
      const adminUsers = await storage.getUsersByRole("admin");
      const requestTypeText = requestData.requestType === "new_account" 
        ? "tài khoản mới" 
        : "reset tài khoản";
      
      for (const admin of adminUsers) {
        await storage.createNotification({
          title: "Yêu cầu tài khoản SWE mới",
          message: `${user.firstName} ${user.lastName} đã gửi yêu cầu ${requestTypeText} cho chương trình SWE từ chi nhánh ${requestData.branchName}. Email: ${requestData.email}`,
          isGlobal: false,
          recipientId: admin.id,
        });
      }
      
      res.json(accountRequest);
    } catch (error) {
      console.error("Error creating account request:", error);
      if ((error as any).name === "ZodError") {
        res.status(400).json({ message: "Invalid data", errors: (error as any).issues });
      } else {
        res.status(500).json({ message: "Failed to create account request" });
      }
    }
  });

  app.put("/api/account-requests/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      // Check if request exists
      const existingRequest = await storage.getAccountRequest(id);
      if (!existingRequest) {
        return res.status(404).json({ message: "Account request not found" });
      }

      const updateData = req.body;
      const updatedRequest = await storage.updateAccountRequest(id, updateData);
      
      // Tạo thông báo cho user khi admin cập nhật status
      if (updateData.status && updateData.status !== existingRequest.status) {
        let statusText = "";
        switch (updateData.status) {
          case "processing":
            statusText = "đang được xử lý";
            break;
          case "completed":
            statusText = "đã hoàn thành";
            break;
          case "rejected":
            statusText = "đã bị từ chối";
            break;
          default:
            statusText = updateData.status;
        }
        
        await storage.createNotification({
          title: "Cập nhật yêu cầu tài khoản SWE",
          message: `Yêu cầu tài khoản SWE của bạn ${statusText}. ${updateData.adminNotes ? `Ghi chú: ${updateData.adminNotes}` : ''}`,
          isGlobal: false,
          recipientId: existingRequest.userId,
        });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating account request:", error);
      if ((error as any).name === "ZodError") {
        res.status(400).json({ message: "Invalid data", errors: (error as any).issues });
      } else {
        res.status(500).json({ message: "Failed to update account request" });
      }
    }
  });

  // Send email for account request
  app.post("/api/account-requests/:id/send-email", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Get the account request
      const request = await storage.getAccountRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Account request not found" });
      }

      // Generate email content based on request type
      const { subject, html } = generateAccountRequestEmail(
        request.requestType,
        request.branchName,
        request.fileUrl || ""
      );

      // Send email
      const emailSent = await sendEmail({
        to: "nphuc210@gmail.com",
        subject,
        html
      });

      if (emailSent) {
        // Auto update status to completed and add admin notes
        const updateData = {
          status: "completed" as const,
          adminNotes: "Danh sách học viên đã được gửi đến nhà xuất bản, danh sách tài khoản sẽ được gửi đến bạn qua email mà bạn đã nhập trong thời gian sớm nhất."
        };
        
        const updatedRequest = await storage.updateAccountRequest(id, updateData);
        
        // Create notification for user (reuse existing logic)
        await storage.createNotification({
          title: "Cập nhật yêu cầu tài khoản SWE",
          message: `Yêu cầu tài khoản SWE của bạn đã hoàn thành. Ghi chú: ${updateData.adminNotes}`,
          isGlobal: false,
          recipientId: request.userId,
        });
        
        res.json({ 
          success: true, 
          message: "Email đã được gửi thành công"
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Không thể gửi email. Vui lòng thử lại."
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ 
        success: false, 
        message: "Lỗi khi gửi email"
      });
    }
  });

  // Send custom email for account request
  app.post("/api/account-requests/:id/send-custom-email", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { to, cc, subject, content } = req.body;

      if (!to || !subject || !content) {
        return res.status(400).json({ 
          message: "Missing required fields: to, subject, content" 
        });
      }

      // Get the account request (for validation)
      const request = await storage.getAccountRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Account request not found" });
      }

      // Generate fresh viewing URL if file exists
      let finalContent = content;
      if (request.fileUrl) {
        const objectStorageService = new ObjectStorageService();
        const viewingUrl = await objectStorageService.generateViewingURL(request.fileUrl);
        // Replace the upload URL with viewing URL in content
        finalContent = content.replace(request.fileUrl, viewingUrl);
      }

      // Prepare email data
      const emailData: any = {
        to: to.trim(),
        subject: subject.trim(),
        html: finalContent.replace(/\n/g, '<br>')
      };

      if (cc && cc.trim()) {
        emailData.cc = cc.trim();
      }

      // Send email
      const emailSent = await sendEmail(emailData);

      if (emailSent) {
        // Auto update status to completed and add admin notes
        const updateData = {
          status: "completed" as const,
          adminNotes: "Danh sách học viên đã được gửi đến nhà xuất bản, danh sách tài khoản sẽ được gửi đến bạn qua email mà bạn đã nhập trong thời gian sớm nhất."
        };
        
        const updatedRequest = await storage.updateAccountRequest(id, updateData);
        
        // Create notification for user (reuse existing logic)
        await storage.createNotification({
          title: "Cập nhật yêu cầu tài khoản SWE",
          message: `Yêu cầu tài khoản SWE của bạn đã hoàn thành. Ghi chú: ${updateData.adminNotes}`,
          isGlobal: false,
          recipientId: request.userId,
        });
        
        res.json({ 
          success: true, 
          message: "Email đã được gửi thành công"
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Không thể gửi email. Vui lòng thử lại."
        });
      }
    } catch (error) {
      console.error("Error sending custom email:", error);
      res.status(500).json({ 
        success: false, 
        message: "Lỗi khi gửi email"
      });
    }
  });

  // =============== Theme Settings Endpoints ===============
  
  // Get all theme settings
  app.get("/api/themes", async (req, res) => {
    try {
      const themes = await storage.getAllThemeSettings();
      res.json(themes);
    } catch (error) {
      console.error("Error getting themes:", error);
      res.status(500).json({ message: "Lỗi khi tải danh sách giao diện" });
    }
  });

  // Get active theme
  app.get("/api/themes/active", async (req, res) => {
    try {
      const activeTheme = await storage.getActiveTheme();
      res.json(activeTheme || { themeName: "default", displayName: "Mặc định" });
    } catch (error) {
      console.error("Error getting active theme:", error);
      res.status(500).json({ message: "Lỗi khi tải giao diện hiện tại" });
    }
  });

  // Set active theme (Admin only)
  app.post("/api/themes/activate", isAuthenticated, isAdmin, async (req, res) => {
    console.log("DEBUG: Route handler called!");
    try {
      const { themeName } = req.body;
      
      console.log("DEBUG: Received theme activation request for:", themeName);
      
      if (!themeName) {
        console.log("DEBUG: No theme name provided");
        return res.status(400).json({ message: "Tên giao diện là bắt buộc" });
      }

      console.log("DEBUG: About to call storage.setActiveTheme");
      const theme = await storage.setActiveTheme(themeName);
      console.log("DEBUG: Theme set successfully:", theme);
      res.json(theme);
    } catch (error) {
      console.error("DEBUG: Error in theme activation:", error);
      res.status(500).json({ message: "Lỗi khi thiết lập giao diện" });
    }
  });

  // Real-time chat endpoints

  // Get online users (Admin only)
  app.get("/api/chat/online-users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const onlineUsers = await storage.getOnlineUsers();
      res.json(onlineUsers);
    } catch (error) {
      console.error("Error getting online users:", error);
      res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng online" });
    }
  });

  // Get chat history between admin and user
  app.get("/api/chat/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;
      const currentUserRole = req.user?.role;

      // Only admin can access any chat, users can only access their own chat with admin
      if (currentUserRole !== "admin" && userId !== currentUserId) {
        return res.status(403).json({ message: "Không có quyền truy cập" });
      }

      const chatHistory = await storage.getAdminUserChatHistory(userId);
      res.json(chatHistory);
    } catch (error) {
      console.error("Error getting chat history:", error);
      res.status(500).json({ message: "Lỗi khi lấy lịch sử chat" });
    }
  });

  // Send message in admin-user chat
  app.post("/api/chat/:userId/send", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { message } = req.body;
      const senderId = req.user?.id;
      const senderRole = req.user?.role;

      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Tin nhắn không được để trống" });
      }

      // Only admin can send to any user, users can only send to admin
      if (senderRole !== "admin" && userId !== senderId) {
        return res.status(403).json({ message: "Không có quyền gửi tin nhắn" });
      }

      const newMessage = await storage.sendAdminUserMessage({
        userId: senderRole === "admin" ? userId : senderId,
        senderId,
        senderRole,
        message: message.trim(),
      });

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Lỗi khi gửi tin nhắn" });
    }
  });

  // Mark messages as read
  app.post("/api/chat/:userId/mark-read", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;
      const currentUserRole = req.user?.role;

      // Only admin can mark any chat as read, users can only mark their own chat
      if (currentUserRole !== "admin" && userId !== currentUserId) {
        return res.status(403).json({ message: "Không có quyền truy cập" });
      }

      await storage.markAdminUserMessagesAsRead(userId, currentUserId, currentUserRole);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Lỗi khi đánh dấu tin nhắn đã đọc" });
    }
  });

  // Create theme setting (Admin only)
  app.post("/api/themes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = insertThemeSettingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Dữ liệu không hợp lệ", 
          errors: result.error.issues 
        });
      }

      const theme = await storage.createThemeSetting(result.data);
      res.status(201).json(theme);
    } catch (error) {
      console.error("Error creating theme:", error);
      res.status(500).json({ message: "Lỗi khi tạo giao diện" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket Server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections: Map<userId, WebSocket>
  const activeConnections = new Map<string, WebSocket>();

  wss.on('connection', async (ws: WebSocket, req) => {
    console.log('New WebSocket connection');
    let userId: string | null = null;

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'authenticate') {
          userId = data.userId;
          if (userId) {
            activeConnections.set(userId, ws);
            
            // Add user to online users table
            try {
              await storage.addOnlineUser({
                userId,
                socketId: Math.random().toString(36).substring(7),
                userAgent: req.headers['user-agent'] || null,
                ipAddress: req.socket.remoteAddress || null,
              });
              
              console.log(`User ${userId} connected to WebSocket`);
              
              // Notify admins about new online user
              broadcastToAdmins({
                type: 'user_online',
                userId,
              });
              
            } catch (error) {
              console.error('Error adding online user:', error);
            }
          }
        } else if (data.type === 'new_message') {
          // Handle new message broadcasting
          const { targetUserId, chatId } = data;
          
          if (targetUserId) {
            const targetSocket = activeConnections.get(targetUserId);
            if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
              targetSocket.send(JSON.stringify({
                type: 'new_message',
                ...data
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', async () => {
      if (userId) {
        activeConnections.delete(userId);
        
        try {
          await storage.removeOnlineUser(userId);
          console.log(`User ${userId} disconnected from WebSocket`);
          
          // Notify admins about user going offline
          broadcastToAdmins({
            type: 'user_offline',
            userId,
          });
          
        } catch (error) {
          console.error('Error removing online user:', error);
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Helper function to broadcast messages to all admin users
  function broadcastToAdmins(data: any) {
    activeConnections.forEach((socket, userId) => {
      // We need to check if user is admin - this would require user data lookup
      // For now, we'll implement a simple broadcast to all connected users
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
      }
    });
  }

  // Helper function to send message to specific user
  function sendToUser(userId: string, data: any) {
    const socket = activeConnections.get(userId);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  }

  return httpServer;
}
