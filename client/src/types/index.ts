// Client-specific type definitions (no drizzle dependencies)
import { z } from "zod";

export interface User {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  password?: string | null;
  role: string;
  isActive: boolean;
  authProvider?: string | null;
  googleId?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Program {
  id: string;
  name: string;
  description?: string | null;
  curriculum: string;
  ageRange: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  programId?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Document {
  id: string;
  title: string;
  description?: string | null;
  links: Array<{ url: string; description: string }>;
  fileType?: string | null;
  categoryId?: string | null;
  programId?: string | null;
  uploadedBy?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  userId: string;
  assignedTo?: string | null;
  issueDate?: Date | null;
  branch?: string | null;
  classLevel?: string | null;
  documentLink?: string | null;
  imageUrls?: string[] | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface TrainingFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadPath: string;
  createdAt?: Date | null;
}

export interface ImportantDocument {
  id: string;
  title: string;
  description?: string | null;
  links: Array<{ url: string; description: string }>;
  fileType?: string | null;
  uploadedBy?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  isGlobal: boolean;
  createdBy: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface UserNotification {
  id: string;
  userId: string;
  notificationId: string;
  isRead: boolean;
  createdAt?: Date | null;
}

// Insert/Create types
export interface InsertUser {
  email: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: string;
  authProvider?: string;
  googleId?: string;
  isActive?: boolean;
}

export interface InsertSupportTicket {
  description: string;
  priority?: string;
  userId?: string;
  issueDate: string;
  branch: string;
  classLevel: string;
  documentLink?: string;
  imageUrls?: string[];
  status?: string;
}

export interface InsertProgram {
  name: string;
  description?: string;
  curriculum: string;
  ageRange: string;
}

export interface InsertCategory {
  name: string;
  description?: string;
  programId?: string;
}

export interface InsertDocument {
  title: string;
  description?: string;
  links: Array<{ url: string; description: string }>;
  fileType?: string;
  categoryId?: string;
  programId?: string;
  uploadedBy?: string;
}

export interface InsertNotification {
  title: string;
  message: string;
  isGlobal?: boolean;
}

// Additional types
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: Date | null;
  assignedTo?: string | null;
  createdBy: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface InsertProject {
  name: string;
  description?: string;
  assignee: string;
  status?: string;
  link?: string;
  deadline?: Date; // Optional vì được handle riêng qua date state
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface InsertAccount {
  name: string;
  type: string;
  balance?: number;
  currency?: string;
  isActive?: boolean;
}

export interface ChatConversation {
  id: string;
  userId: string;
  title?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  content: string;
  role: string;
  createdAt?: Date | null;
}

// Form schemas (Zod)

export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z.string().optional(),
  role: z.string().optional().default("user"),
  authProvider: z.string().optional().default("manual")
});

export const insertSupportTicketSchema = z.object({
  description: z.string().min(1, "Mô tả là bắt buộc"),
  priority: z.string().optional().default("normal"),
  issueDate: z.string().min(1, "Ngày gặp vấn đề là bắt buộc"),
  branch: z.string().min(1, "Chi nhánh là bắt buộc"),
  classLevel: z.string().min(1, "Cấp độ lớp học là bắt buộc"),
  documentLink: z.string().optional(),
  imageUrls: z.array(z.string()).max(5, "Tối đa 5 hình ảnh").optional(),
  status: z.string().optional().default("open")
});

export const insertProgramSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  curriculum: z.string().min(1),
  ageRange: z.string().min(1)
});

export const insertCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  programId: z.string().optional()
});

export const insertDocumentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  links: z.array(z.object({
    url: z.string().url(),
    description: z.string()
  })),
  fileType: z.string().optional(),
  categoryId: z.string().optional(),
  programId: z.string().optional()
});

export const insertNotificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  isGlobal: z.boolean().optional().default(false)
});

// Bulk creation types
export interface BulkCreateDocuments {
  documents: Array<{
    title: string;
    description?: string;
    links: Array<{ url: string; description: string }>;
    fileType?: string;
  }>;
  categoryId?: string;
  programId?: string;
}

export interface BulkCreateCategories {
  categories: Array<{
    name: string;
    description?: string;
  }>;
  programId?: string;
}

// Additional schemas
export const bulkCreateDocumentsSchema = z.object({
  documents: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    links: z.array(z.object({
      url: z.string().url(),
      description: z.string()
    })),
    fileType: z.string().optional()
  })),
  categoryId: z.string().optional(),
  programId: z.string().optional()
});

export const bulkCreateCategoriesSchema = z.object({
  categories: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional()
  })),
  programId: z.string().optional()
});

export const documentLinkSchema = z.object({
  url: z.string().url(),
  description: z.string().min(1)
});

export const insertProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  assignee: z.string().min(1),
  status: z.string().optional().default("todo"),
  link: z.string().optional()
});

export const insertAccountSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  balance: z.number().optional().default(0),
  currency: z.string().optional().default("VND"),
  isActive: z.boolean().optional().default(true)
});