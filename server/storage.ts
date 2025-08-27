import {
  users,
  programs,
  categories,
  documents,
  notifications,
  userNotifications,
  type User,
  type UpsertUser,
  type Program,
  type Category,
  type Document,
  type Notification,
  type UserNotification,
  type InsertProgram,
  type InsertCategory,
  type InsertDocument,
  type InsertNotification,
  type InsertUserNotification,
  type CreateUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Admin user operations
  createUser(userData: CreateUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  
  // Program operations
  getAllPrograms(): Promise<Program[]>;
  getProgram(id: string): Promise<Program | undefined>;
  createProgram(programData: InsertProgram): Promise<Program>;
  updateProgram(id: string, programData: Partial<InsertProgram>): Promise<Program>;
  deleteProgram(id: string): Promise<void>;
  
  // Category operations
  getCategoriesByProgram(programId: string): Promise<Category[]>;
  getAllCategories(): Promise<(Category & { program: Program })[]>;
  createCategory(categoryData: InsertCategory): Promise<Category>;
  updateCategory(id: string, categoryData: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  
  // Document operations
  getDocumentsByCategory(categoryId: string): Promise<Document[]>;
  getDocumentsByProgram(programId: string): Promise<Document[]>;
  getAllDocuments(): Promise<(Document & { category: Category | null, program: Program | null })[]>;
  getRecentDocuments(limit: number): Promise<(Document & { category: Category | null, program: Program | null })[]>;
  createDocument(documentData: InsertDocument): Promise<Document>;
  updateDocument(id: string, documentData: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  
  // Notification operations
  getAllNotifications(): Promise<Notification[]>;
  getNotificationsForUser(userId: string): Promise<(UserNotification & { notification: Notification })[]>;
  getUnreadNotificationsForUser(userId: string): Promise<(UserNotification & { notification: Notification })[]>;
  createNotification(notificationData: InsertNotification): Promise<Notification>;
  markNotificationAsRead(userId: string, notificationId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  
  // Stats
  getStats(): Promise<{
    totalPrograms: number;
    totalDocuments: number;
    totalUsers: number;
    unreadNotifications: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Admin user operations
  async createUser(userData: CreateUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        id: sql`gen_random_uuid()`,
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Program operations
  async getAllPrograms(): Promise<Program[]> {
    return await db.select().from(programs).orderBy(desc(programs.createdAt));
  }

  async getProgram(id: string): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.id, id));
    return program;
  }

  async createProgram(programData: InsertProgram): Promise<Program> {
    const [program] = await db.insert(programs).values(programData).returning();
    return program;
  }

  async updateProgram(id: string, programData: Partial<InsertProgram>): Promise<Program> {
    const [program] = await db
      .update(programs)
      .set({ ...programData, updatedAt: new Date() })
      .where(eq(programs.id, id))
      .returning();
    return program;
  }

  async deleteProgram(id: string): Promise<void> {
    await db.delete(programs).where(eq(programs.id, id));
  }

  // Category operations
  async getCategoriesByProgram(programId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.programId, programId))
      .orderBy(desc(categories.createdAt));
  }

  async getAllCategories(): Promise<(Category & { program: Program })[]> {
    return await db
      .select()
      .from(categories)
      .innerJoin(programs, eq(categories.programId, programs.id))
      .orderBy(desc(categories.createdAt))
      .then(results => results.map(result => ({
        ...result.categories,
        program: result.programs
      })));
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(categoryData).returning();
    return category;
  }

  async updateCategory(id: string, categoryData: Partial<InsertCategory>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set({ ...categoryData, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Document operations
  async getDocumentsByCategory(categoryId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.categoryId, categoryId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentsByProgram(programId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.programId, programId))
      .orderBy(desc(documents.createdAt));
  }

  async getAllDocuments(): Promise<(Document & { category: Category | null, program: Program | null })[]> {
    return await db
      .select()
      .from(documents)
      .leftJoin(categories, eq(documents.categoryId, categories.id))
      .leftJoin(programs, eq(documents.programId, programs.id))
      .orderBy(desc(documents.createdAt))
      .then(results => results.map(result => ({
        ...result.documents,
        category: result.categories,
        program: result.programs
      })));
  }

  async getRecentDocuments(limit: number): Promise<(Document & { category: Category | null, program: Program | null })[]> {
    return await db
      .select()
      .from(documents)
      .leftJoin(categories, eq(documents.categoryId, categories.id))
      .leftJoin(programs, eq(documents.programId, programs.id))
      .orderBy(desc(documents.updatedAt))
      .limit(limit)
      .then(results => results.map(result => ({
        ...result.documents,
        category: result.categories,
        program: result.programs
      })));
  }

  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  }

  async updateDocument(id: string, documentData: Partial<InsertDocument>): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set({ ...documentData, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Notification operations
  async getAllNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async getNotificationsForUser(userId: string): Promise<(UserNotification & { notification: Notification })[]> {
    return await db
      .select()
      .from(userNotifications)
      .innerJoin(notifications, eq(userNotifications.notificationId, notifications.id))
      .where(eq(userNotifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .then(results => results.map(result => ({
        ...result.user_notifications,
        notification: result.notifications
      })));
  }

  async getUnreadNotificationsForUser(userId: string): Promise<(UserNotification & { notification: Notification })[]> {
    return await db
      .select()
      .from(userNotifications)
      .innerJoin(notifications, eq(userNotifications.notificationId, notifications.id))
      .where(and(
        eq(userNotifications.userId, userId),
        eq(userNotifications.isRead, false)
      ))
      .orderBy(desc(notifications.createdAt))
      .then(results => results.map(result => ({
        ...result.user_notifications,
        notification: result.notifications
      })));
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    
    // Create user notification records for all users if it's global
    if (notificationData.isGlobal !== false) {
      const allUsers = await db.select({ id: users.id }).from(users);
      const userNotificationRecords = allUsers.map(user => ({
        userId: user.id,
        notificationId: notification.id,
        isRead: false,
      }));
      
      if (userNotificationRecords.length > 0) {
        await db.insert(userNotifications).values(userNotificationRecords);
      }
    }
    
    return notification;
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    await db
      .update(userNotifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(and(
        eq(userNotifications.userId, userId),
        eq(userNotifications.notificationId, notificationId)
      ));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Stats
  async getStats(): Promise<{
    totalPrograms: number;
    totalDocuments: number;
    totalUsers: number;
    unreadNotifications: number;
  }> {
    const [programsCount] = await db.select({ count: sql`count(*)` }).from(programs);
    const [documentsCount] = await db.select({ count: sql`count(*)` }).from(documents);
    const [usersCount] = await db.select({ count: sql`count(*)` }).from(users);
    const [unreadCount] = await db
      .select({ count: sql`count(*)` })
      .from(userNotifications)
      .where(eq(userNotifications.isRead, false));

    return {
      totalPrograms: Number(programsCount.count),
      totalDocuments: Number(documentsCount.count),
      totalUsers: Number(usersCount.count),
      unreadNotifications: Number(unreadCount.count),
    };
  }
}

export const storage = new DatabaseStorage();
