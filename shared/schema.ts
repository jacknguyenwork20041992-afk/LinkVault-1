import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password"), // Optional password for manual creation
  role: varchar("role").notNull().default("user"), // "admin" or "user"
  isActive: boolean("is_active").notNull().default(true), // true = active, false = deactivated
  authProvider: varchar("auth_provider").default("manual"), // "manual", "replit", "google"
  googleId: varchar("google_id"), // Google ID for Google auth users
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Programs table
export const programs = pgTable("programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  curriculum: varchar("curriculum").notNull(), // Giáo trình: "Face2Face", "English File", "New Headway", etc.
  ageRange: varchar("age_range").notNull(), // Độ tuổi: "3-6 tuổi", "7-12 tuổi", "13-17 tuổi", "18+ tuổi", etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  programId: varchar("program_id").references(() => programs.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  // Changed from single link to array of links with descriptions
  links: jsonb("links").notNull(), // Array of {url: string, description: string}
  fileType: varchar("file_type"), // "pdf", "doc", "xls", etc.
  categoryId: varchar("category_id").references(() => categories.id, { onDelete: "cascade" }),
  programId: varchar("program_id").references(() => programs.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isGlobal: boolean("is_global").default(true), // true for all users, false for specific users
  recipientId: varchar("recipient_id").references(() => users.id), // for specific user notifications (legacy)
  targetUserIds: jsonb("target_user_ids"), // Array of user IDs for multiple specific users
  createdAt: timestamp("created_at").defaultNow(),
});

// User notifications junction table (for tracking read status)
export const userNotifications = pgTable("user_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  notificationId: varchar("notification_id").references(() => notifications.id, { onDelete: "cascade" }),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
});

// Activities table for tracking user actions
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // "login", "document_click", "logout"
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Additional data like document info, IP address, etc.
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Important documents table
export const importantDocuments = pgTable("important_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  assigneeId: varchar("assignee_id").references(() => users.id, { onDelete: "set null" }), // Project leader
  deadline: timestamp("deadline").notNull(),
  status: varchar("status").notNull().default("todo"), // todo, in_progress, completed, cancelled
  link: varchar("link"), // Link project (optional)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project tasks table for task management within projects
export const projectTasks = pgTable("project_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name").notNull(), // Tên công việc
  assigneeId: varchar("assignee_id").references(() => users.id, { onDelete: "set null" }), // Người thực hiện
  description: text("description"), // Mô tả (optional)
  link: varchar("link"), // Link (optional)
  deadline: timestamp("deadline").notNull(),
  status: varchar("status").notNull().default("todo"), // todo, in_progress, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Accounts table for storing website accounts
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  url: varchar("url").notNull(),
  category: varchar("category"),
  username: varchar("username").notNull(),
  password: varchar("password").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support Tools table
export const supportTools = pgTable("support_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  link: text("link").notNull(),
  description: text("description"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat conversations table
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(), // Auto-generated or user-defined title
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages table  
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => chatConversations.id, { onDelete: "cascade" }),
  role: varchar("role").notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Knowledge Base Tables for AI Training
export const knowledgeCategories = pgTable("knowledge_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const knowledgeArticles = pgTable("knowledge_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => knowledgeCategories.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  keywords: text("keywords").array(),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const faqItems = pgTable("faq_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  categoryId: varchar("category_id").references(() => knowledgeCategories.id),
  keywords: text("keywords").array(),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training Files table for uploaded documents to train AI
export const trainingFiles = pgTable("training_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  objectPath: varchar("object_path").notNull(),
  extractedContent: text("extracted_content"),
  metadata: jsonb("metadata"),
  status: varchar("status").notNull().default("processing"), // processing, completed, failed
  uploadedBy: varchar("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support tickets table
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  issueDate: timestamp("issue_date", { mode: "string" }).notNull(),
  branch: varchar("branch").notNull(), // Chi nhánh
  classLevel: varchar("class_level").notNull(), // Cấp độ lớp học
  description: text("description").notNull(), // Mô tả vấn đề
  documentLink: text("document_link"), // Link tài liệu bị vấn đề
  imageUrls: text("image_urls").array(), // Array URLs hình ảnh upload (tối đa 5)
  status: varchar("status").notNull().default("open"), // open, in_progress, resolved, closed
  priority: varchar("priority").default("normal"), // low, normal, high, urgent
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support responses table  
export const supportResponses = pgTable("support_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").references(() => supportTickets.id, { onDelete: "cascade" }).notNull(),
  responderId: varchar("responder_id").references(() => users.id).notNull(), // Admin responding
  response: text("response").notNull(),
  isInternal: boolean("is_internal").default(false), // true for internal admin notes
  createdAt: timestamp("created_at").defaultNow(),
});

// Account requests table for SWE Program student accounts
export const accountRequests = pgTable("account_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  branchName: varchar("branch_name").notNull(), // Chi nhánh
  email: varchar("email").notNull(),
  requestType: varchar("request_type").notNull(), // "new_account" | "un_tag_account"
  fileName: varchar("file_name"), // Tên file upload
  fileUrl: varchar("file_url"), // URL của file upload
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, rejected
  adminNotes: text("admin_notes"), // Ghi chú của admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Theme settings table for holiday themes
export const themeSettings = pgTable("theme_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  themeName: varchar("theme_name").notNull(), // "default", "tet", "christmas", "halloween", "mid_autumn", "teachers_day"
  displayName: varchar("display_name").notNull(), // Display name in Vietnamese
  description: text("description"), // Mô tả theme
  isActive: boolean("is_active").default(false), // Only one theme can be active at a time
  metadata: jsonb("metadata"), // Additional theme data like colors, icons, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Real-time chat tables (admin-user communication)
export const adminUserChats = pgTable("admin_user_chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  adminId: varchar("admin_id").references(() => users.id, { onDelete: "cascade" }),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  userUnreadCount: integer("user_unread_count").default(0), // Unread messages for user
  adminUnreadCount: integer("admin_unread_count").default(0), // Unread messages for admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminUserMessages = pgTable("admin_user_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").references(() => adminUserChats.id, { onDelete: "cascade" }).notNull(),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  senderRole: varchar("sender_role").notNull(), // "admin" or "user"
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const onlineUsers = pgTable("online_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  socketId: varchar("socket_id").notNull(),
  lastSeen: timestamp("last_seen").defaultNow(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userNotifications: many(userNotifications),
  activities: many(activities),
  chatConversations: many(chatConversations),
  assignedProjects: many(projects),
  assignedTasks: many(projectTasks),
}));

export const programsRelations = relations(programs, ({ many }) => ({
  categories: many(categories),
  documents: many(documents),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  program: one(programs, {
    fields: [categories.programId],
    references: [programs.id],
  }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  category: one(categories, {
    fields: [documents.categoryId],
    references: [categories.id],
  }),
  program: one(programs, {
    fields: [documents.programId],
    references: [programs.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ many }) => ({
  userNotifications: many(userNotifications),
}));

export const userNotificationsRelations = relations(userNotifications, ({ one }) => ({
  user: one(users, {
    fields: [userNotifications.userId],
    references: [users.id],
  }),
  notification: one(notifications, {
    fields: [userNotifications.notificationId],
    references: [notifications.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [chatConversations.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  assignee: one(users, {
    fields: [projects.assigneeId],
    references: [users.id],
  }),
  tasks: many(projectTasks),
}));

export const projectTasksRelations = relations(projectTasks, ({ one }) => ({
  project: one(projects, {
    fields: [projectTasks.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [projectTasks.assigneeId],
    references: [users.id],
  }),
}));

export const knowledgeCategoriesRelations = relations(knowledgeCategories, ({ many }) => ({
  articles: many(knowledgeArticles),
  faqs: many(faqItems),
}));

export const knowledgeArticlesRelations = relations(knowledgeArticles, ({ one }) => ({
  category: one(knowledgeCategories, {
    fields: [knowledgeArticles.categoryId],
    references: [knowledgeCategories.id],
  }),
}));

export const faqItemsRelations = relations(faqItems, ({ one }) => ({
  category: one(knowledgeCategories, {
    fields: [faqItems.categoryId],
    references: [knowledgeCategories.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
  responses: many(supportResponses),
}));

export const supportResponsesRelations = relations(supportResponses, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [supportResponses.ticketId],
    references: [supportTickets.id],
  }),
  responder: one(users, {
    fields: [supportResponses.responderId],
    references: [users.id],
  }),
}));

export const accountRequestsRelations = relations(accountRequests, ({ one }) => ({
  user: one(users, {
    fields: [accountRequests.userId],
    references: [users.id],
  }),
}));

export const adminUserChatsRelations = relations(adminUserChats, ({ one, many }) => ({
  user: one(users, {
    fields: [adminUserChats.userId],
    references: [users.id],
  }),
  admin: one(users, {
    fields: [adminUserChats.adminId],
    references: [users.id],
  }),
  messages: many(adminUserMessages),
}));

export const adminUserMessagesRelations = relations(adminUserMessages, ({ one }) => ({
  chat: one(adminUserChats, {
    fields: [adminUserMessages.chatId],
    references: [adminUserChats.id],
  }),
  sender: one(users, {
    fields: [adminUserMessages.senderId],
    references: [users.id],
  }),
}));

export const onlineUsersRelations = relations(onlineUsers, ({ one }) => ({
  user: one(users, {
    fields: [onlineUsers.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const upsertUserSchema = createInsertSchema(users);
export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
// Document link schema
export const documentLinkSchema = z.object({
  url: z.string().url("Link phải là URL hợp lệ"),
  description: z.string().min(1, "Mô tả link là bắt buộc"),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  links: z.array(documentLinkSchema).min(1, "Phải có ít nhất 1 link"),
});
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
}).extend({
  targetUserIds: z.array(z.string()).optional(), // Array of user IDs for targeted notifications
});
export const insertUserNotificationSchema = createInsertSchema(userNotifications).omit({
  id: true,
  readAt: true,
});
export const createUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  password: true,
  role: true,
  profileImageUrl: true,
  authProvider: true,
  googleId: true,
}).extend({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").optional(),
  role: z.enum(["admin", "user"]).default("user"),
  profileImageUrl: z.string().optional(),
  authProvider: z.enum(["manual", "replit", "google"]).default("manual"),
  googleId: z.string().optional(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  deadline: z.string().datetime().transform((str) => new Date(str)),
});

export const insertProjectTaskSchema = createInsertSchema(projectTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  deadline: z.string().datetime().transform((str) => new Date(str)),
});

export const insertImportantDocumentSchema = createInsertSchema(importantDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupportToolSchema = createInsertSchema(supportTools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertKnowledgeCategorySchema = createInsertSchema(knowledgeCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKnowledgeArticleSchema = createInsertSchema(knowledgeArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFaqItemSchema = createInsertSchema(faqItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingFileSchema = createInsertSchema(trainingFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  issueDate: z.string(), // Force string type
  imageUrls: z.array(z.string()).max(5, "Tối đa 5 hình ảnh").optional(),
});

export const insertSupportResponseSchema = createInsertSchema(supportResponses).omit({
  id: true,
  createdAt: true,
});

export const insertAccountRequestSchema = createInsertSchema(accountRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  requestType: z.enum(["new_account", "un_tag_account"]),
  status: z.enum(["pending", "processing", "completed", "rejected"]).default("pending"),
  branchName: z.enum([
    "Bờ Bao Tân Thắng",
    "Tỉnh Lộ 10", 
    "Huỳnh Thiện Lộc",
    "Gamuda",
    "Hà Huy Tập",
    "Nguyễn Văn Lương",
    "Bùi Đình Túy",
    "Hồng Hà",
    "Đại Thanh",
    "Ocean Park",
    "Nguyễn Tri Phương",
    "Phú Đông",
    "Thủ Dầu Một"
  ]),
});

export const insertThemeSettingSchema = createInsertSchema(themeSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  themeName: z.enum(["default", "tet", "christmas", "halloween", "mid_autumn", "teachers_day"]),
  displayName: z.string().min(1, "Tên hiển thị là bắt buộc"),
  description: z.string().optional(),
  isActive: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
});

export const insertAdminUserChatSchema = createInsertSchema(adminUserChats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMessageAt: true,
});

export const insertAdminUserMessageSchema = createInsertSchema(adminUserMessages).omit({
  id: true,
  createdAt: true,
  readAt: true,
}).extend({
  senderRole: z.enum(["admin", "user"]),
  message: z.string().min(1, "Tin nhắn không được để trống"),
});

export const insertOnlineUserSchema = createInsertSchema(onlineUsers).omit({
  id: true,
  createdAt: true,
  lastSeen: true,
});

export const bulkCreateDocumentsSchema = z.object({
  documents: z.array(insertDocumentSchema).min(1, "Phải có ít nhất 1 tài liệu"),
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertUserNotification = z.infer<typeof insertUserNotificationSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type BulkCreateDocuments = z.infer<typeof bulkCreateDocumentsSchema>;
export type ImportantDocument = typeof importantDocuments.$inferSelect;
export type InsertImportantDocument = z.infer<typeof insertImportantDocumentSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type KnowledgeCategory = typeof knowledgeCategories.$inferSelect;
export type InsertKnowledgeCategory = z.infer<typeof insertKnowledgeCategorySchema>;
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type InsertKnowledgeArticle = z.infer<typeof insertKnowledgeArticleSchema>;
export type FaqItem = typeof faqItems.$inferSelect;
export type InsertFaqItem = z.infer<typeof insertFaqItemSchema>;
export type TrainingFile = typeof trainingFiles.$inferSelect;
export type InsertTrainingFile = z.infer<typeof insertTrainingFileSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportResponse = typeof supportResponses.$inferSelect;
export type InsertSupportResponse = z.infer<typeof insertSupportResponseSchema>;
export type AccountRequest = typeof accountRequests.$inferSelect;
export type InsertAccountRequest = z.infer<typeof insertAccountRequestSchema>;
export type ThemeSetting = typeof themeSettings.$inferSelect;
export type InsertThemeSetting = z.infer<typeof insertThemeSettingSchema>;
export type AdminUserChat = typeof adminUserChats.$inferSelect;
export type InsertAdminUserChat = z.infer<typeof insertAdminUserChatSchema>;
export type AdminUserMessage = typeof adminUserMessages.$inferSelect;
export type InsertAdminUserMessage = z.infer<typeof insertAdminUserMessageSchema>;
export type OnlineUser = typeof onlineUsers.$inferSelect;
export type InsertOnlineUser = z.infer<typeof insertOnlineUserSchema>;
