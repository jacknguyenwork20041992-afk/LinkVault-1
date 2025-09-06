// Client-specific type definitions (no drizzle dependencies)

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
  title: string;
  description: string;
  priority?: string;
  userId: string;
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
  content: string;
  type: string;
  isGlobal?: boolean;
  createdBy: string;
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
  status?: string;
  priority?: string;
  dueDate?: Date;
  assignedTo?: string;
  createdBy: string;
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

// Form schemas (simplified)
export const createUserSchema = {
  email: { required: true },
  firstName: { required: false },
  lastName: { required: false },
  password: { required: false },
  role: { required: false, default: "user" },
  authProvider: { required: false, default: "manual" }
};

export const insertSupportTicketSchema = {
  title: { required: true },
  description: { required: true },
  priority: { required: false, default: "medium" },
  userId: { required: true }
};

export const insertProgramSchema = {
  name: { required: true },
  description: { required: false },
  curriculum: { required: true },
  ageRange: { required: true }
};

export const insertCategorySchema = {
  name: { required: true },
  description: { required: false },
  programId: { required: false }
};

export const insertDocumentSchema = {
  title: { required: true },
  description: { required: false },
  links: { required: true },
  fileType: { required: false },
  categoryId: { required: false },
  programId: { required: false }
};

export const insertNotificationSchema = {
  title: { required: true },
  content: { required: true },
  type: { required: true },
  isGlobal: { required: false, default: false },
  createdBy: { required: true }
};

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
export const bulkCreateDocumentsSchema = {
  documents: { required: true },
  categoryId: { required: false },
  programId: { required: false }
};

export const bulkCreateCategoriesSchema = {
  categories: { required: true },
  programId: { required: false }
};

export const documentLinkSchema = {
  url: { required: true },
  description: { required: true }
};

export const insertProjectSchema = {
  name: { required: true },
  description: { required: false },
  status: { required: false, default: "planning" },
  priority: { required: false, default: "medium" },
  dueDate: { required: false },
  assignedTo: { required: false },
  createdBy: { required: true }
};

export const insertAccountSchema = {
  name: { required: true },
  type: { required: true },
  balance: { required: false, default: 0 },
  currency: { required: false, default: "VND" },
  isActive: { required: false, default: true }
};