import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { isAdmin } from "./auth";
import {
  insertProgramSchema,
  insertCategorySchema,
  insertDocumentSchema,
  insertNotificationSchema,
  insertActivitySchema,
  insertProjectSchema,
  createUserSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup both auth systems
  await setupAuth(app); // Replit Auth
  
  const { setupAuth: setupLocalAuth, isAuthenticated: isLocalAuth } = await import("./auth");
  setupLocalAuth(app); // Email/Password Auth

  // Hybrid auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      let user;
      // Check if user is authenticated via Replit Auth
      if (req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        user = await storage.getUser(userId);
      } 
      // Check if user is authenticated via local auth
      else if (req.user?.id) {
        user = await storage.getUser(req.user.id);
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Separate Replit login endpoint
  app.get("/api/login/replit", (req, res, next) => {
    const passport = require("passport");
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  // Hybrid authentication middleware
  const hybridAuth = (req: any, res: any, next: any) => {
    // Check Replit auth first
    if (req.user?.claims?.sub) {
      return next();
    }
    // Check local auth
    if (req.user?.id && req.isAuthenticated()) {
      return next(); 
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Program routes
  app.get("/api/programs", hybridAuth, async (req, res) => {
    try {
      const programs = await storage.getAllPrograms();
      res.json(programs);
    } catch (error) {
      console.error("Error fetching programs:", error);
      res.status(500).json({ message: "Failed to fetch programs" });
    }
  });

  app.get("/api/programs/:id", hybridAuth, async (req, res) => {
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

  app.post("/api/programs", hybridAuth, isAdmin, async (req, res) => {
    try {
      const validatedData = insertProgramSchema.parse(req.body);
      const program = await storage.createProgram(validatedData);
      res.json(program);
    } catch (error) {
      console.error("Error creating program:", error);
      res.status(400).json({ message: "Failed to create program" });
    }
  });

  app.put("/api/programs/:id", hybridAuth, isAdmin, async (req, res) => {
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

  app.delete("/api/programs/:id", hybridAuth, isAdmin, async (req, res) => {
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
  app.get("/api/categories", hybridAuth, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/programs/:programId/categories", hybridAuth, async (req, res) => {
    try {
      const { programId } = req.params;
      const categories = await storage.getCategoriesByProgram(programId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", hybridAuth, isAdmin, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", hybridAuth, isAdmin, async (req, res) => {
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

  app.delete("/api/categories/:id", hybridAuth, isAdmin, async (req, res) => {
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
  app.get("/api/documents", hybridAuth, async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/recent", hybridAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const documents = await storage.getRecentDocuments(limit);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching recent documents:", error);
      res.status(500).json({ message: "Failed to fetch recent documents" });
    }
  });

  app.get("/api/categories/:categoryId/documents", hybridAuth, async (req, res) => {
    try {
      const { categoryId } = req.params;
      const documents = await storage.getDocumentsByCategory(categoryId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/programs/:programId/documents", hybridAuth, async (req, res) => {
    try {
      const { programId } = req.params;
      const documents = await storage.getDocumentsByProgram(programId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", hybridAuth, isAdmin, async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(validatedData);
      res.json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(400).json({ message: "Failed to create document" });
    }
  });

  app.post("/api/documents/bulk", hybridAuth, isAdmin, async (req, res) => {
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
  app.post("/api/categories/bulk", hybridAuth, isAdmin, async (req, res) => {
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

  app.put("/api/documents/:id", hybridAuth, isAdmin, async (req, res) => {
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

  app.delete("/api/documents/:id", hybridAuth, isAdmin, async (req, res) => {
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
  app.get("/api/users", hybridAuth, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", hybridAuth, isAdmin, async (req, res) => {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", hybridAuth, isAdmin, async (req, res) => {
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

  app.delete("/api/users/:id", hybridAuth, isAdmin, async (req, res) => {
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
  app.get("/api/notifications", hybridAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotificationsForUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread", hybridAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getUnreadNotificationsForUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  app.post("/api/notifications", hybridAuth, isAdmin, async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(400).json({ message: "Failed to create notification" });
    }
  });

  app.put("/api/notifications/:id/read", hybridAuth, async (req: any, res) => {
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

  app.delete("/api/notifications/:id", hybridAuth, isAdmin, async (req, res) => {
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
  app.get("/api/activities", hybridAuth, isAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const activities = await storage.getAllActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/recent", hybridAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });

  app.post("/api/activities/track", hybridAuth, async (req: any, res) => {
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

  app.post("/api/activities/login", hybridAuth, async (req: any, res) => {
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
  app.get("/api/projects", hybridAuth, isAdmin, async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", hybridAuth, isAdmin, async (req, res) => {
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

  app.post("/api/projects", hybridAuth, isAdmin, async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", hybridAuth, isAdmin, async (req, res) => {
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

  app.delete("/api/projects/:id", hybridAuth, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Admin stats
  app.get("/api/admin/stats", hybridAuth, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
