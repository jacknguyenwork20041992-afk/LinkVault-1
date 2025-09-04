import {
  users,
  programs,
  categories,
  documents,
  notifications,
  userNotifications,
  activities,
  projects,
  importantDocuments,
  accounts,
  chatConversations,
  chatMessages,
  knowledgeCategories,
  knowledgeArticles,
  faqItems,
  trainingFiles,
  supportTickets,
  supportResponses,
  accountRequests,
  themeSettings,
  adminUserChats,
  adminUserMessages,
  onlineUsers,
  type User,
  type UpsertUser,
  type Program,
  type Category,
  type Document,
  type Notification,
  type UserNotification,
  type Activity,
  type Project,
  type ImportantDocument,
  type Account,
  type ChatConversation,
  type ChatMessage,
  type KnowledgeCategory,
  type KnowledgeArticle,
  type FaqItem,
  type TrainingFile,
  type SupportTicket,
  type SupportResponse,
  type AccountRequest,
  type ThemeSetting,
  type InsertProgram,
  type InsertCategory,
  type InsertDocument,
  type InsertNotification,
  type InsertUserNotification,
  type InsertActivity,
  type InsertProject,
  type InsertImportantDocument,
  type InsertAccount,
  type InsertChatConversation,
  type InsertChatMessage,
  type InsertKnowledgeCategory,
  type InsertKnowledgeArticle,
  type InsertFaqItem,
  type InsertTrainingFile,
  type InsertSupportTicket,
  type InsertSupportResponse,
  type InsertAccountRequest,
  type InsertThemeSetting,
  type AdminUserChat,
  type AdminUserMessage,
  type OnlineUser,
  type InsertAdminUserChat,
  type InsertAdminUserMessage,
  type InsertOnlineUser,
  type CreateUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, asc } from "drizzle-orm";
import bcrypt from "bcrypt";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Admin user operations
  createUser(userData: CreateUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  toggleUserActive(id: string, isActive: boolean): Promise<User>;
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
  createCategories(categoriesData: InsertCategory[]): Promise<Category[]>;
  updateCategory(id: string, categoryData: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  
  // Document operations
  getDocumentsByCategory(categoryId: string): Promise<Document[]>;
  getDocumentsByProgram(programId: string): Promise<(Document & { category: Category | null })[]>;
  getAllDocuments(): Promise<(Document & { category: Category | null, program: Program | null })[]>;
  getRecentDocuments(limit: number): Promise<(Document & { category: Category | null, program: Program | null })[]>;
  createDocument(documentData: InsertDocument): Promise<Document>;
  createDocuments(documentsData: InsertDocument[]): Promise<Document[]>;
  updateDocument(id: string, documentData: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  
  // Notification operations
  getAllNotifications(): Promise<Notification[]>;
  getNotificationsForUser(userId: string, page?: number, limit?: number): Promise<{ notifications: (UserNotification & { notification: Notification })[], total: number, totalPages: number }>;
  getUnreadNotificationsForUser(userId: string): Promise<(UserNotification & { notification: Notification })[]>;
  createNotification(notificationData: InsertNotification): Promise<Notification>;
  markNotificationAsRead(userId: string, notificationId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  
  // Activity operations
  createActivity(activityData: InsertActivity): Promise<Activity>;
  getActivitiesByUser(userId: string, limit?: number): Promise<Activity[]>;
  getAllActivities(limit?: number): Promise<(Activity & { user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> | null })[]>;
  getRecentActivities(limit?: number): Promise<(Activity & { user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> | null })[]>;
  
  // Project operations
  getAllProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(projectData: InsertProject): Promise<Project>;
  updateProject(id: string, projectData: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Important document operations
  getAllImportantDocuments(): Promise<ImportantDocument[]>;
  getImportantDocument(id: string): Promise<ImportantDocument | undefined>;
  createImportantDocument(documentData: InsertImportantDocument): Promise<ImportantDocument>;
  updateImportantDocument(id: string, documentData: Partial<InsertImportantDocument>): Promise<ImportantDocument>;
  deleteImportantDocument(id: string): Promise<void>;

  // Accounts operations
  getAllAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  createAccount(accountData: InsertAccount): Promise<Account>;
  updateAccount(id: string, accountData: Partial<InsertAccount>): Promise<Account>;
  deleteAccount(id: string): Promise<void>;
  
  // Chat operations
  getChatConversations(userId: string): Promise<ChatConversation[]>;
  getChatConversation(id: string, userId: string): Promise<(ChatConversation & { messages: ChatMessage[] }) | undefined>;
  createChatConversation(conversationData: InsertChatConversation): Promise<ChatConversation>;
  createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage>;
  deleteChatConversation(id: string, userId: string): Promise<void>;
  
  // Knowledge Base operations for AI training
  getAllKnowledgeCategories(): Promise<KnowledgeCategory[]>;
  getKnowledgeCategory(id: string): Promise<KnowledgeCategory | undefined>;
  createKnowledgeCategory(categoryData: InsertKnowledgeCategory): Promise<KnowledgeCategory>;
  updateKnowledgeCategory(id: string, categoryData: Partial<InsertKnowledgeCategory>): Promise<KnowledgeCategory>;
  deleteKnowledgeCategory(id: string): Promise<void>;
  
  getKnowledgeArticlesByCategory(categoryId: string): Promise<KnowledgeArticle[]>;
  getAllKnowledgeArticles(): Promise<(KnowledgeArticle & { category: KnowledgeCategory | null })[]>;
  getKnowledgeArticle(id: string): Promise<KnowledgeArticle | undefined>;
  createKnowledgeArticle(articleData: InsertKnowledgeArticle): Promise<KnowledgeArticle>;
  updateKnowledgeArticle(id: string, articleData: Partial<InsertKnowledgeArticle>): Promise<KnowledgeArticle>;
  deleteKnowledgeArticle(id: string): Promise<void>;
  
  getFaqItemsByCategory(categoryId: string): Promise<FaqItem[]>;
  getAllFaqItems(): Promise<(FaqItem & { category: KnowledgeCategory | null })[]>;
  getFaqItem(id: string): Promise<FaqItem | undefined>;
  createFaqItem(faqData: InsertFaqItem): Promise<FaqItem>;
  updateFaqItem(id: string, faqData: Partial<InsertFaqItem>): Promise<FaqItem>;
  deleteFaqItem(id: string): Promise<void>;
  
  searchKnowledgeBase(query: string): Promise<{
    articles: KnowledgeArticle[];
    faqs: FaqItem[];
  }>;
  
  // Convert training file to knowledge base
  convertTrainingFileToKnowledgeBase(trainingFileId: string, categoryId?: string): Promise<KnowledgeArticle>;
  
  // Training Files operations
  getAllTrainingFiles(): Promise<TrainingFile[]>;
  getTrainingFile(id: string): Promise<TrainingFile | undefined>;
  createTrainingFile(fileData: InsertTrainingFile): Promise<TrainingFile>;
  updateTrainingFile(id: string, fileData: Partial<InsertTrainingFile>): Promise<TrainingFile>;
  deleteTrainingFile(id: string): Promise<void>;
  
  // Knowledge operations for AI context
  getKnowledgeContext(): Promise<{
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
    knowledgeBase: Array<{
      category: string;
      articles: Array<{
        title: string;
        content: string;
        keywords: string[];
      }>;
      faqs: Array<{
        question: string;
        answer: string;
        keywords: string[];
      }>;
    }>;
  }>;

  // Stats
  getStats(): Promise<{
    totalPrograms: number;
    totalDocuments: number;
    totalUsers: number;
    unreadNotifications: number;
  }>;

  // Support ticket operations
  getAllSupportTickets(): Promise<(SupportTicket & { user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> })[]>;
  getSupportTicketsByUser(userId: string): Promise<SupportTicket[]>;
  getSupportTicket(id: string): Promise<(SupportTicket & { user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>, responses: (SupportResponse & { responder: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> })[] }) | undefined>;
  createSupportTicket(ticketData: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: string, ticketData: Partial<InsertSupportTicket>): Promise<SupportTicket>;
  deleteSupportTicket(id: string): Promise<void>;

  // Account requests
  getAllAccountRequests(): Promise<(AccountRequest & { user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> })[]>;
  getAccountRequestsByUser(userId: string): Promise<AccountRequest[]>;
  getAccountRequest(id: string): Promise<(AccountRequest & { user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> }) | undefined>;
  createAccountRequest(requestData: InsertAccountRequest): Promise<AccountRequest>;
  updateAccountRequest(id: string, requestData: Partial<InsertAccountRequest>): Promise<AccountRequest>;
  deleteAccountRequest(id: string): Promise<void>;
  
  // Support response operations
  createSupportResponse(responseData: InsertSupportResponse): Promise<SupportResponse>;
  getSupportResponses(ticketId: string): Promise<(SupportResponse & { responder: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> })[]>;

  // AI Learning from support tickets
  convertSupportTicketToTraining(ticketId: string, categoryId?: string): Promise<{ faqId: string; message: string }>;

  // Theme settings operations
  getAllThemeSettings(): Promise<ThemeSetting[]>;
  getActiveTheme(): Promise<ThemeSetting | undefined>;
  createThemeSetting(themeData: InsertThemeSetting): Promise<ThemeSetting>;
  setActiveTheme(themeName: string): Promise<ThemeSetting>;

  // Real-time chat operations
  getOnlineUsers(): Promise<OnlineUser[]>;
  addOnlineUser(userData: InsertOnlineUser): Promise<OnlineUser>;
  removeOnlineUser(userId: string): Promise<void>;
  getAdminUserChatHistory(userId: string): Promise<AdminUserMessage[]>;
  sendAdminUserMessage(messageData: { userId: string; senderId: string; senderRole: string; message: string }): Promise<AdminUserMessage>;
  markAdminUserMessagesAsRead(userId: string, currentUserId: string, currentUserRole: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
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
    const createData = { ...userData };
    // Hash password before creating user
    if (createData.password) {
      createData.password = await bcrypt.hash(createData.password, 10);
    }
    const [user] = await db
      .insert(users)
      .values({
        ...createData,
        id: sql`gen_random_uuid()`,
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role)).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const updateData = { ...userData };
    // If password is provided and not empty, hash it
    if (updateData.password && updateData.password.trim() !== "") {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      // Remove password from update if it's empty or not provided
      delete updateData.password;
    }
    
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async toggleUserActive(id: string, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
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

  async getDocumentsByProgram(programId: string): Promise<(Document & { category: Category | null })[]> {
    return await db
      .select()
      .from(documents)
      .leftJoin(categories, eq(documents.categoryId, categories.id))
      .where(eq(documents.programId, programId))
      .orderBy(desc(documents.createdAt))
      .then(results => results.map(result => ({
        ...result.documents,
        category: result.categories
      })));
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
    // Handle empty categoryId or "none" by setting it to null
    const cleanData = {
      ...documentData,
      categoryId: documentData.categoryId && documentData.categoryId.trim() !== "" && documentData.categoryId !== "none" ? documentData.categoryId : null
    };
    const [document] = await db.insert(documents).values(cleanData).returning();
    return document;
  }

  async createDocuments(documentsData: InsertDocument[]): Promise<Document[]> {
    // Handle empty categoryId or "none" by setting it to null for all documents
    const cleanedData = documentsData.map(doc => ({
      ...doc,
      categoryId: doc.categoryId && doc.categoryId.trim() !== "" && doc.categoryId !== "none" ? doc.categoryId : null
    }));
    const createdDocuments = await db.insert(documents).values(cleanedData).returning();
    return createdDocuments;
  }

  async createCategories(categoriesData: InsertCategory[]): Promise<Category[]> {
    const createdCategories = await db.insert(categories).values(categoriesData).returning();
    return createdCategories;
  }

  async updateDocument(id: string, documentData: Partial<InsertDocument>): Promise<Document> {
    // Handle empty categoryId or "none" by setting it to null
    const cleanData = {
      ...documentData,
      categoryId: documentData.categoryId && documentData.categoryId.trim() !== "" && documentData.categoryId !== "none" ? documentData.categoryId : null,
      updatedAt: new Date()
    };
    const [document] = await db
      .update(documents)
      .set(cleanData)
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

  async getNotificationsForUser(userId: string, page: number = 1, limit: number = 10): Promise<{ notifications: (UserNotification & { notification: Notification })[], total: number, totalPages: number }> {
    const offset = (page - 1) * limit;
    
    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userNotifications)
      .innerJoin(notifications, eq(userNotifications.notificationId, notifications.id))
      .where(eq(userNotifications.userId, userId));
    
    const total = Number(totalResult[0]?.count) || 0;
    const totalPages = Math.ceil(total / limit);
    
    // Get paginated results
    const results = await db
      .select()
      .from(userNotifications)
      .innerJoin(notifications, eq(userNotifications.notificationId, notifications.id))
      .where(eq(userNotifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
    
    const userNotificationsList = results.map((result: any) => ({
      ...result.user_notifications,
      notification: result.notifications
    }));
    
    return {
      notifications: userNotificationsList,
      total,
      totalPages
    };
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
    
    // Create user notification records
    if (notificationData.isGlobal !== false) {
      // Global notification - for all users
      const allUsers = await db.select({ id: users.id }).from(users);
      const userNotificationRecords = allUsers.map(user => ({
        userId: user.id,
        notificationId: notification.id,
        isRead: false,
      }));
      
      if (userNotificationRecords.length > 0) {
        await db.insert(userNotifications).values(userNotificationRecords);
      }
    } else if (notificationData.targetUserIds && notificationData.targetUserIds.length > 0) {
      // Multiple specific users notification
      const userNotificationRecords = notificationData.targetUserIds.map(userId => ({
        userId: userId,
        notificationId: notification.id,
        isRead: false,
      }));
      
      await db.insert(userNotifications).values(userNotificationRecords);
    } else if (notificationData.recipientId) {
      // Single specific user notification (legacy)
      await db.insert(userNotifications).values({
        userId: notificationData.recipientId,
        notificationId: notification.id,
        isRead: false,
      });
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

  // Activity operations
  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(activityData)
      .returning();
    return activity;
  }

  async getActivitiesByUser(userId: string, limit: number = 50): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async getAllActivities(limit: number = 100): Promise<(Activity & { user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> | null })[]> {
    const result = await db
      .select({
        id: activities.id,
        userId: activities.userId,
        type: activities.type,
        description: activities.description,
        metadata: activities.metadata,
        ipAddress: activities.ipAddress,
        userAgent: activities.userAgent,
        createdAt: activities.createdAt,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userIdJoined: users.id,
      })
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .orderBy(desc(activities.createdAt))
      .limit(limit);

    return result.map(row => ({
      id: row.id,
      userId: row.userId,
      type: row.type,
      description: row.description,
      metadata: row.metadata,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: row.createdAt,
      user: row.userIdJoined ? {
        id: row.userIdJoined,
        email: row.userEmail,
        firstName: row.userFirstName,
        lastName: row.userLastName,
      } : null
    }));
  }

  async getRecentActivities(limit: number = 20): Promise<(Activity & { user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> | null })[]> {
    return await this.getAllActivities(limit);
  }

  // Project operations
  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(projectData)
      .returning();
    return project;
  }

  async updateProject(id: string, projectData: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...projectData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Important document operations
  async getAllImportantDocuments(): Promise<ImportantDocument[]> {
    return await db.select().from(importantDocuments).orderBy(desc(importantDocuments.createdAt));
  }

  async getImportantDocument(id: string): Promise<ImportantDocument | undefined> {
    const [importantDoc] = await db.select().from(importantDocuments).where(eq(importantDocuments.id, id));
    return importantDoc;
  }

  async createImportantDocument(documentData: InsertImportantDocument): Promise<ImportantDocument> {
    const [importantDoc] = await db
      .insert(importantDocuments)
      .values({
        ...documentData,
        id: sql`gen_random_uuid()`,
      })
      .returning();
    return importantDoc;
  }

  async updateImportantDocument(id: string, documentData: Partial<InsertImportantDocument>): Promise<ImportantDocument> {
    const [importantDoc] = await db
      .update(importantDocuments)
      .set({ ...documentData, updatedAt: new Date() })
      .where(eq(importantDocuments.id, id))
      .returning();
    return importantDoc;
  }

  async deleteImportantDocument(id: string): Promise<void> {
    await db.delete(importantDocuments).where(eq(importantDocuments.id, id));
  }

  // Accounts operations
  async getAllAccounts(): Promise<Account[]> {
    return await db.select().from(accounts).orderBy(desc(accounts.createdAt));
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async createAccount(accountData: InsertAccount): Promise<Account> {
    const [account] = await db
      .insert(accounts)
      .values({
        ...accountData,
        id: sql`gen_random_uuid()`,
      })
      .returning();
    return account;
  }

  async updateAccount(id: string, accountData: Partial<InsertAccount>): Promise<Account> {
    const [account] = await db
      .update(accounts)
      .set({ ...accountData, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return account;
  }

  async deleteAccount(id: string): Promise<void> {
    await db.delete(accounts).where(eq(accounts.id, id));
  }

  // Chat operations
  async getChatConversations(userId: string): Promise<ChatConversation[]> {
    return await db.select().from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatConversations.updatedAt));
  }

  async getChatConversation(id: string, userId: string): Promise<(ChatConversation & { messages: ChatMessage[] }) | undefined> {
    const [conversation] = await db.select().from(chatConversations)
      .where(and(eq(chatConversations.id, id), eq(chatConversations.userId, userId)));
    
    if (!conversation) return undefined;

    const messages = await db.select().from(chatMessages)
      .where(eq(chatMessages.conversationId, id))
      .orderBy(chatMessages.createdAt);

    return { ...conversation, messages };
  }

  async createChatConversation(conversationData: InsertChatConversation): Promise<ChatConversation> {
    const [conversation] = await db.insert(chatConversations)
      .values(conversationData)
      .returning();
    return conversation;
  }

  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages)
      .values(messageData)
      .returning();
    return message;
  }

  async deleteChatConversation(id: string, userId: string): Promise<void> {
    await db.delete(chatConversations)
      .where(and(eq(chatConversations.id, id), eq(chatConversations.userId, userId)));
  }

  // Real-time admin-user chat operations
  async getOnlineUsers(): Promise<OnlineUser[]> {
    const users = await db.select().from(onlineUsers)
      .orderBy(onlineUsers.createdAt);
    return users;
  }

  async addOnlineUser(userData: InsertOnlineUser): Promise<OnlineUser> {
    // Remove any existing entry for this user first
    await db.delete(onlineUsers).where(eq(onlineUsers.userId, userData.userId));
    
    const [user] = await db.insert(onlineUsers)
      .values(userData)
      .returning();
    return user;
  }

  async removeOnlineUser(userId: string): Promise<void> {
    await db.delete(onlineUsers)
      .where(eq(onlineUsers.userId, userId));
  }

  async getAdminUserChatHistory(userId: string): Promise<AdminUserMessage[]> {
    // First find the chat for this user
    const [chat] = await db.select().from(adminUserChats)
      .where(eq(adminUserChats.userId, userId));
    
    if (!chat) return [];
    
    const messages = await db.select().from(adminUserMessages)
      .where(eq(adminUserMessages.chatId, chat.id))
      .orderBy(adminUserMessages.createdAt);
    return messages;
  }

  async sendAdminUserMessage(messageData: { userId: string; senderId: string; senderRole: string; message: string }): Promise<AdminUserMessage> {
    // First, ensure chat exists
    let chat = await db.select().from(adminUserChats)
      .where(eq(adminUserChats.userId, messageData.userId));
    
    if (chat.length === 0) {
      const [newChat] = await db.insert(adminUserChats)
        .values({
          userId: messageData.userId,
          lastMessageAt: new Date(),
        })
        .returning();
      chat = [newChat];
    } else {
      // Update the chat's lastMessageAt timestamp
      await db.update(adminUserChats)
        .set({ lastMessageAt: new Date() })
        .where(eq(adminUserChats.userId, messageData.userId));
    }

    // Insert the message using chatId
    const [message] = await db.insert(adminUserMessages)
      .values({
        chatId: chat[0].id,
        senderId: messageData.senderId,
        senderRole: messageData.senderRole,
        message: messageData.message,
      })
      .returning();
    
    return message;
  }

  async markAdminUserMessagesAsRead(userId: string, currentUserId: string, currentUserRole: string): Promise<void> {
    // First find the chat for this user
    const [chat] = await db.select().from(adminUserChats)
      .where(eq(adminUserChats.userId, userId));
    
    if (!chat) return;

    // Mark messages as read based on the role
    if (currentUserRole === "admin") {
      // Admin is reading messages from user
      await db.update(adminUserMessages)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(adminUserMessages.chatId, chat.id),
            eq(adminUserMessages.senderRole, "user")
          )
        );
    } else {
      // User is reading messages from admin
      await db.update(adminUserMessages)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(adminUserMessages.chatId, chat.id),
            eq(adminUserMessages.senderRole, "admin")
          )
        );
    }
  }

  // Knowledge Base operations for AI training
  async getAllKnowledgeCategories(): Promise<KnowledgeCategory[]> {
    return await db.select().from(knowledgeCategories).orderBy(knowledgeCategories.name);
  }

  async getKnowledgeCategory(id: string): Promise<KnowledgeCategory | undefined> {
    const [category] = await db.select().from(knowledgeCategories).where(eq(knowledgeCategories.id, id));
    return category;
  }

  async createKnowledgeCategory(categoryData: InsertKnowledgeCategory): Promise<KnowledgeCategory> {
    const [category] = await db.insert(knowledgeCategories)
      .values(categoryData)
      .returning();
    return category;
  }

  async updateKnowledgeCategory(id: string, categoryData: Partial<InsertKnowledgeCategory>): Promise<KnowledgeCategory> {
    const [category] = await db.update(knowledgeCategories)
      .set({ ...categoryData, updatedAt: new Date() })
      .where(eq(knowledgeCategories.id, id))
      .returning();
    return category;
  }

  async deleteKnowledgeCategory(id: string): Promise<void> {
    await db.delete(knowledgeCategories).where(eq(knowledgeCategories.id, id));
  }

  async getKnowledgeArticlesByCategory(categoryId: string): Promise<KnowledgeArticle[]> {
    return await db.select().from(knowledgeArticles)
      .where(eq(knowledgeArticles.categoryId, categoryId))
      .orderBy(desc(knowledgeArticles.priority), knowledgeArticles.title);
  }

  async getAllKnowledgeArticles(): Promise<(KnowledgeArticle & { category: KnowledgeCategory | null })[]> {
    return await db.select({
      id: knowledgeArticles.id,
      categoryId: knowledgeArticles.categoryId,
      title: knowledgeArticles.title,
      content: knowledgeArticles.content,
      keywords: knowledgeArticles.keywords,
      isActive: knowledgeArticles.isActive,
      priority: knowledgeArticles.priority,
      createdAt: knowledgeArticles.createdAt,
      updatedAt: knowledgeArticles.updatedAt,
      category: knowledgeCategories,
    })
    .from(knowledgeArticles)
    .leftJoin(knowledgeCategories, eq(knowledgeArticles.categoryId, knowledgeCategories.id))
    .orderBy(desc(knowledgeArticles.priority), knowledgeArticles.title);
  }

  async getKnowledgeArticle(id: string): Promise<KnowledgeArticle | undefined> {
    const [article] = await db.select().from(knowledgeArticles).where(eq(knowledgeArticles.id, id));
    return article;
  }

  async createKnowledgeArticle(articleData: InsertKnowledgeArticle): Promise<KnowledgeArticle> {
    const [article] = await db.insert(knowledgeArticles)
      .values(articleData)
      .returning();
    return article;
  }

  async updateKnowledgeArticle(id: string, articleData: Partial<InsertKnowledgeArticle>): Promise<KnowledgeArticle> {
    const [article] = await db.update(knowledgeArticles)
      .set({ ...articleData, updatedAt: new Date() })
      .where(eq(knowledgeArticles.id, id))
      .returning();
    return article;
  }

  async deleteKnowledgeArticle(id: string): Promise<void> {
    await db.delete(knowledgeArticles).where(eq(knowledgeArticles.id, id));
  }

  async getFaqItemsByCategory(categoryId: string): Promise<FaqItem[]> {
    return await db.select().from(faqItems)
      .where(eq(faqItems.categoryId, categoryId))
      .orderBy(desc(faqItems.priority), faqItems.question);
  }

  async getAllFaqItems(): Promise<(FaqItem & { category: KnowledgeCategory | null })[]> {
    return await db.select({
      id: faqItems.id,
      question: faqItems.question,
      answer: faqItems.answer,
      categoryId: faqItems.categoryId,
      keywords: faqItems.keywords,
      isActive: faqItems.isActive,
      priority: faqItems.priority,
      createdAt: faqItems.createdAt,
      updatedAt: faqItems.updatedAt,
      category: knowledgeCategories,
    })
    .from(faqItems)
    .leftJoin(knowledgeCategories, eq(faqItems.categoryId, knowledgeCategories.id))
    .orderBy(desc(faqItems.priority), faqItems.question);
  }

  async getFaqItem(id: string): Promise<FaqItem | undefined> {
    const [faq] = await db.select().from(faqItems).where(eq(faqItems.id, id));
    return faq;
  }

  async createFaqItem(faqData: InsertFaqItem): Promise<FaqItem> {
    const [faq] = await db.insert(faqItems)
      .values(faqData)
      .returning();
    return faq;
  }

  async updateFaqItem(id: string, faqData: Partial<InsertFaqItem>): Promise<FaqItem> {
    const [faq] = await db.update(faqItems)
      .set({ ...faqData, updatedAt: new Date() })
      .where(eq(faqItems.id, id))
      .returning();
    return faq;
  }

  async deleteFaqItem(id: string): Promise<void> {
    await db.delete(faqItems).where(eq(faqItems.id, id));
  }

  async searchKnowledgeBase(query: string): Promise<{ articles: KnowledgeArticle[], faqs: FaqItem[] }> {
    // Search in articles by title, content, and keywords
    const articles = await db.select().from(knowledgeArticles)
      .where(and(
        eq(knowledgeArticles.isActive, true),
        sql`(
          ${knowledgeArticles.title} ILIKE ${'%' + query + '%'} OR 
          ${knowledgeArticles.content} ILIKE ${'%' + query + '%'} OR 
          array_to_string(${knowledgeArticles.keywords}, ' ') ILIKE ${'%' + query + '%'}
        )`
      ))
      .orderBy(desc(knowledgeArticles.priority));

    // Search in FAQs by question, answer, and keywords
    const faqs = await db.select().from(faqItems)
      .where(and(
        eq(faqItems.isActive, true),
        sql`(
          ${faqItems.question} ILIKE ${'%' + query + '%'} OR 
          ${faqItems.answer} ILIKE ${'%' + query + '%'} OR 
          array_to_string(${faqItems.keywords}, ' ') ILIKE ${'%' + query + '%'}
        )`
      ))
      .orderBy(desc(faqItems.priority));

    return { articles, faqs };
  }

  // Training Files operations
  async getAllTrainingFiles(): Promise<TrainingFile[]> {
    return await db.select().from(trainingFiles).orderBy(desc(trainingFiles.createdAt));
  }

  async getTrainingFile(id: string): Promise<TrainingFile | undefined> {
    const [file] = await db.select().from(trainingFiles).where(eq(trainingFiles.id, id));
    return file;
  }

  async createTrainingFile(fileData: InsertTrainingFile): Promise<TrainingFile> {
    const [file] = await db.insert(trainingFiles).values(fileData).returning();
    return file;
  }

  async updateTrainingFile(id: string, fileData: Partial<InsertTrainingFile>): Promise<TrainingFile> {
    const [file] = await db.update(trainingFiles)
      .set(fileData)
      .where(eq(trainingFiles.id, id))
      .returning();
    return file;
  }

  async deleteTrainingFile(id: string): Promise<void> {
    await db.delete(trainingFiles).where(eq(trainingFiles.id, id));
  }

  // Knowledge operations for AI context
  async getKnowledgeContext() {
    // Get programs with categories and documents
    const programsData = await db.select({
      program: programs,
      category: categories,
      document: documents,
    })
    .from(programs)
    .leftJoin(categories, eq(programs.id, categories.programId))
    .leftJoin(documents, eq(categories.id, documents.categoryId))
    .orderBy(programs.name, categories.name, documents.title);

    // Transform to structured data
    const programsMap = new Map();
    
    programsData.forEach(row => {
      const programId = row.program.id;
      
      if (!programsMap.has(programId)) {
        programsMap.set(programId, {
          name: row.program.name,
          description: row.program.description,
          curriculum: row.program.curriculum,
          ageRange: row.program.ageRange,
          categories: new Map()
        });
      }
      
      const program = programsMap.get(programId);
      
      if (row.category) {
        const categoryId = row.category.id;
        
        if (!program.categories.has(categoryId)) {
          program.categories.set(categoryId, {
            name: row.category.name,
            description: row.category.description,
            documents: []
          });
        }
        
        const category = program.categories.get(categoryId);
        
        if (row.document) {
          category.documents.push({
            title: row.document.title,
            description: row.document.description,
            links: Array.isArray(row.document.links) ? row.document.links : []
          });
        }
      }
    });

    // Convert maps to arrays
    const programsResult = Array.from(programsMap.values()).map(program => ({
      ...program,
      categories: Array.from(program.categories.values())
    }));

    // Get recent notifications
    const notificationsData = await db.select().from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(10);

    // Get active projects
    const projectsData = await db.select().from(projects)
      .orderBy(desc(projects.createdAt))
      .limit(10);

    // Get important documents
    const importantDocsData = await db.select().from(importantDocuments)
      .orderBy(desc(importantDocuments.createdAt));

    // Get knowledge base data
    const knowledgeData = await db.select({
      category: knowledgeCategories,
      article: knowledgeArticles,
      faq: faqItems,
    })
    .from(knowledgeCategories)
    .leftJoin(knowledgeArticles, eq(knowledgeCategories.id, knowledgeArticles.categoryId))
    .leftJoin(faqItems, eq(knowledgeCategories.id, faqItems.categoryId))
    .orderBy(knowledgeCategories.name);

    // Transform knowledge base data
    const knowledgeMap = new Map();
    
    knowledgeData.forEach(row => {
      const categoryId = row.category.id;
      
      if (!knowledgeMap.has(categoryId)) {
        knowledgeMap.set(categoryId, {
          category: row.category.name,
          articles: [],
          faqs: []
        });
      }
      
      const knowledge = knowledgeMap.get(categoryId);
      
      if (row.article && row.article.isActive) {
        knowledge.articles.push({
          title: row.article.title,
          content: row.article.content,
          keywords: row.article.keywords || []
        });
      }
      
      if (row.faq && row.faq.isActive) {
        knowledge.faqs.push({
          question: row.faq.question,
          answer: row.faq.answer,
          keywords: row.faq.keywords || []
        });
      }
    });

    const knowledgeResult = Array.from(knowledgeMap.values());

    return {
      programs: programsResult,
      notifications: notificationsData.map(n => ({
        title: n.title,
        message: n.message,
        createdAt: n.createdAt?.toISOString() || new Date().toISOString()
      })),
      projects: projectsData.map(p => ({
        name: p.name,
        description: p.description || undefined,
        assignee: p.assignee,
        status: p.status,
        deadline: p.deadline.toISOString()
      })),
      importantDocuments: importantDocsData.map(d => ({
        title: d.title,
        description: d.description || undefined,
        url: d.url
      })),
      knowledgeBase: knowledgeResult
    };
  }

  // Stats
  async getStats(): Promise<{
    totalPrograms: number;
    totalDocuments: number;
    totalUsers: number;
    unreadNotifications: number;
  }> {
    // Use a single query with subqueries for better performance
    const [stats] = await db.select({
      totalPrograms: sql<number>`(SELECT COUNT(*) FROM ${programs})`,
      totalDocuments: sql<number>`(SELECT COUNT(*) FROM ${documents})`,
      totalUsers: sql<number>`(SELECT COUNT(*) FROM ${users})`,
      unreadNotifications: sql<number>`(SELECT COUNT(*) FROM ${userNotifications} WHERE ${userNotifications.isRead} = false)`
    }).from(sql`(SELECT 1) AS dummy`);

    return {
      totalPrograms: Number(stats.totalPrograms),
      totalDocuments: Number(stats.totalDocuments),
      totalUsers: Number(stats.totalUsers),
      unreadNotifications: Number(stats.unreadNotifications),
    };
  }

  // Convert training file to knowledge base article
  async convertTrainingFileToKnowledgeBase(trainingFileId: string, categoryId?: string): Promise<KnowledgeArticle> {
    // Get the training file
    const trainingFile = await this.getTrainingFile(trainingFileId);
    if (!trainingFile) {
      throw new Error("Training file not found");
    }

    // If no extracted content, throw error
    if (!trainingFile.extractedContent || trainingFile.extractedContent.trim() === '') {
      throw new Error("Training file has no extracted content");
    }

    // Get or create default category for training files
    let targetCategoryId = categoryId;
    if (!targetCategoryId) {
      // Check if "Training Files" category exists
      const categories = await this.getAllKnowledgeCategories();
      let trainingCategory = categories.find(c => c.name === "Tài liệu Training");
      
      if (!trainingCategory) {
        // Create default category for training files
        trainingCategory = await this.createKnowledgeCategory({
          name: "Tài liệu Training", 
          description: "Kiến thức được trích xuất từ các file training upload"
        });
      }
      targetCategoryId = trainingCategory.id;
    }

    // Extract keywords from filename and content
    const keywords = this.extractKeywords(trainingFile.originalName, trainingFile.extractedContent);

    // Create knowledge article from training file content
    const articleData = {
      categoryId: targetCategoryId,
      title: `[Training File] ${trainingFile.originalName}`,
      content: `📄 **File nguồn:** ${trainingFile.originalName}\n📁 **Loại file:** ${trainingFile.fileType}\n📊 **Kích thước:** ${(trainingFile.fileSize / 1024).toFixed(1)}KB\n⏰ **Ngày upload:** ${new Date(trainingFile.createdAt!).toLocaleDateString('vi-VN')}\n\n---\n\n${trainingFile.extractedContent}`,
      keywords,
      isActive: true,
      priority: 0
    };

    // Create the knowledge article
    const article = await this.createKnowledgeArticle(articleData);

    // Update training file to mark as converted
    await this.updateTrainingFile(trainingFileId, {
      metadata: {
        ...trainingFile.metadata as any,
        convertedToKnowledge: true,
        knowledgeArticleId: article.id,
        convertedAt: new Date().toISOString()
      }
    });

    return article;
  }

  // Helper method to extract keywords from filename and content
  private extractKeywords(filename: string, content: string): string[] {
    const keywords = new Set<string>();
    
    // Extract from filename (remove extension and split by common separators)
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const filenameWords = nameWithoutExt.split(/[-_\s]+/).filter(word => word.length > 2);
    filenameWords.forEach(word => keywords.add(word.toLowerCase()));
    
    // Extract common Vietnamese keywords from content
    const vietnameseKeywords = [
      'tiếng anh', 'english', 'grammar', 'vocabulary', 'speaking', 'listening', 'reading', 'writing',
      'ngữ pháp', 'từ vựng', 'nói', 'nghe', 'đọc', 'viết', 'bài tập', 'exercise', 'lesson', 'bài học',
      'chương trình', 'program', 'khóa học', 'course', 'cơ bản', 'nâng cao', 'intermediate', 'advanced',
      'beginners', 'basic', 'student', 'học viên', 'giáo viên', 'teacher', 'class', 'lớp học'
    ];
    
    const contentLower = content.toLowerCase();
    vietnameseKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        keywords.add(keyword);
      }
    });
    
    // Limit to first 10 keywords
    return Array.from(keywords).slice(0, 10);
  }

  // Support ticket operations
  async getAllSupportTickets(): Promise<(SupportTicket & { user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> })[]> {
    return await db
      .select({
        id: supportTickets.id,
        userId: supportTickets.userId,
        issueDate: supportTickets.issueDate,
        branch: supportTickets.branch,
        classLevel: supportTickets.classLevel,
        description: supportTickets.description,
        documentLink: supportTickets.documentLink,
        imageUrls: supportTickets.imageUrls,
        status: supportTickets.status,
        priority: supportTickets.priority,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userIdJoined: users.id,
      })
      .from(supportTickets)
      .innerJoin(users, eq(supportTickets.userId, users.id))
      .orderBy(desc(supportTickets.createdAt))
      .then(results => results.map(row => ({
        id: row.id,
        userId: row.userId,
        issueDate: row.issueDate,
        branch: row.branch,
        classLevel: row.classLevel,
        description: row.description,
        documentLink: row.documentLink,
        imageUrls: row.imageUrls,
        status: row.status,
        priority: row.priority,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: {
          id: row.userIdJoined,
          email: row.userEmail,
          firstName: row.userFirstName,
          lastName: row.userLastName,
        }
      })));
  }

  async getSupportTicketsByUser(userId: string): Promise<SupportTicket[]> {
    return await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicket(id: string): Promise<(SupportTicket & { user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>, responses: (SupportResponse & { responder: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> })[] }) | undefined> {
    // Get ticket with user info
    const ticketResult = await db
      .select({
        id: supportTickets.id,
        userId: supportTickets.userId,
        issueDate: supportTickets.issueDate,
        branch: supportTickets.branch,
        classLevel: supportTickets.classLevel,
        description: supportTickets.description,
        documentLink: supportTickets.documentLink,
        imageUrls: supportTickets.imageUrls,
        status: supportTickets.status,
        priority: supportTickets.priority,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userIdJoined: users.id,
      })
      .from(supportTickets)
      .innerJoin(users, eq(supportTickets.userId, users.id))
      .where(eq(supportTickets.id, id));

    if (ticketResult.length === 0) {
      return undefined;
    }

    const ticket = ticketResult[0];

    // Get responses for this ticket
    const responses = await this.getSupportResponses(id);

    return {
      id: ticket.id,
      userId: ticket.userId,
      issueDate: ticket.issueDate,
      branch: ticket.branch,
      classLevel: ticket.classLevel,
      description: ticket.description,
      documentLink: ticket.documentLink,
      imageUrls: ticket.imageUrls,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      user: {
        id: ticket.userIdJoined,
        email: ticket.userEmail,
        firstName: ticket.userFirstName,
        lastName: ticket.userLastName,
      },
      responses
    };
  }

  async createSupportTicket(ticketData: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db
      .insert(supportTickets)
      .values(ticketData)
      .returning();
    return ticket;
  }

  async updateSupportTicket(id: string, ticketData: Partial<InsertSupportTicket>): Promise<SupportTicket> {
    const [ticket] = await db
      .update(supportTickets)
      .set({ ...ticketData, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return ticket;
  }

  async deleteSupportTicket(id: string): Promise<void> {
    await db.delete(supportTickets).where(eq(supportTickets.id, id));
  }

  // Account requests
  async getAllAccountRequests(): Promise<(AccountRequest & { user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> })[]> {
    return await db
      .select({
        id: accountRequests.id,
        userId: accountRequests.userId,
        branchName: accountRequests.branchName,
        email: accountRequests.email,
        requestType: accountRequests.requestType,
        fileName: accountRequests.fileName,
        fileUrl: accountRequests.fileUrl,
        status: accountRequests.status,
        adminNotes: accountRequests.adminNotes,
        createdAt: accountRequests.createdAt,
        updatedAt: accountRequests.updatedAt,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userIdJoined: users.id,
      })
      .from(accountRequests)
      .innerJoin(users, eq(accountRequests.userId, users.id))
      .orderBy(desc(accountRequests.createdAt))
      .then(results => results.map(row => ({
        id: row.id,
        userId: row.userId,
        branchName: row.branchName,
        email: row.email,
        requestType: row.requestType,
        fileName: row.fileName,
        fileUrl: row.fileUrl,
        status: row.status,
        adminNotes: row.adminNotes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: {
          id: row.userIdJoined,
          email: row.userEmail,
          firstName: row.userFirstName,
          lastName: row.userLastName,
        }
      })));
  }

  async getAccountRequestsByUser(userId: string): Promise<AccountRequest[]> {
    return await db
      .select()
      .from(accountRequests)
      .where(eq(accountRequests.userId, userId))
      .orderBy(desc(accountRequests.createdAt));
  }

  async getAccountRequest(id: string): Promise<(AccountRequest & { user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> }) | undefined> {
    const result = await db
      .select({
        id: accountRequests.id,
        userId: accountRequests.userId,
        branchName: accountRequests.branchName,
        email: accountRequests.email,
        requestType: accountRequests.requestType,
        fileName: accountRequests.fileName,
        fileUrl: accountRequests.fileUrl,
        status: accountRequests.status,
        adminNotes: accountRequests.adminNotes,
        createdAt: accountRequests.createdAt,
        updatedAt: accountRequests.updatedAt,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userIdJoined: users.id,
      })
      .from(accountRequests)
      .innerJoin(users, eq(accountRequests.userId, users.id))
      .where(eq(accountRequests.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      id: row.id,
      userId: row.userId,
      branchName: row.branchName,
      email: row.email,
      requestType: row.requestType,
      fileName: row.fileName,
      fileUrl: row.fileUrl,
      status: row.status,
      adminNotes: row.adminNotes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.userIdJoined,
        email: row.userEmail,
        firstName: row.userFirstName,
        lastName: row.userLastName,
      }
    };
  }

  async createAccountRequest(requestData: InsertAccountRequest): Promise<AccountRequest> {
    const [request] = await db
      .insert(accountRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async updateAccountRequest(id: string, requestData: Partial<InsertAccountRequest>): Promise<AccountRequest> {
    const [request] = await db
      .update(accountRequests)
      .set({ ...requestData, updatedAt: new Date() })
      .where(eq(accountRequests.id, id))
      .returning();
    return request;
  }

  async deleteAccountRequest(id: string): Promise<void> {
    await db.delete(accountRequests).where(eq(accountRequests.id, id));
  }

  // Support response operations
  async createSupportResponse(responseData: InsertSupportResponse): Promise<SupportResponse> {
    const [response] = await db
      .insert(supportResponses)
      .values(responseData)
      .returning();
    return response;
  }

  async getSupportResponses(ticketId: string): Promise<(SupportResponse & { responder: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> })[]> {
    return await db
      .select({
        id: supportResponses.id,
        ticketId: supportResponses.ticketId,
        responderId: supportResponses.responderId,
        response: supportResponses.response,
        isInternal: supportResponses.isInternal,
        createdAt: supportResponses.createdAt,
        responderEmail: users.email,
        responderFirstName: users.firstName,
        responderLastName: users.lastName,
        responderIdJoined: users.id,
      })
      .from(supportResponses)
      .innerJoin(users, eq(supportResponses.responderId, users.id))
      .where(eq(supportResponses.ticketId, ticketId))
      .orderBy(supportResponses.createdAt)
      .then(results => results.map(row => ({
        id: row.id,
        ticketId: row.ticketId,
        responderId: row.responderId,
        response: row.response,
        isInternal: row.isInternal,
        createdAt: row.createdAt,
        responder: {
          id: row.responderIdJoined,
          email: row.responderEmail,
          firstName: row.responderFirstName,
          lastName: row.responderLastName,
        }
      })));
  }

  // AI Learning from support tickets
  async convertSupportTicketToTraining(ticketId: string, categoryId?: string): Promise<{ faqId: string; message: string }> {
    // Get the support ticket with responses
    const ticket = await this.getSupportTicket(ticketId);
    if (!ticket) {
      throw new Error("Support ticket not found");
    }

    // Only convert resolved or closed tickets
    if (ticket.status !== "resolved" && ticket.status !== "closed") {
      throw new Error("Only resolved or closed tickets can be converted to training data");
    }

    // Get public responses (not internal)
    const publicResponses = ticket.responses.filter(r => !r.isInternal);
    if (publicResponses.length === 0) {
      throw new Error("No public responses found to create training data");
    }

    // Create question from ticket description
    const question = `${ticket.description}${ticket.branch ? ` (Chi nhánh: ${ticket.branch})` : ''}${ticket.classLevel ? ` (Lớp: ${ticket.classLevel})` : ''}`;

    // Combine all public responses into a comprehensive answer
    const answer = publicResponses
      .map(response => response.response)
      .join('\n\n');

    // Auto-generate keywords from question and answer
    const keywords = this.extractKeywordsFromText(`${question} ${answer}`);

    // If no categoryId provided, try to find or create a "Support Q&A" category
    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      // Try to find existing "Support Q&A" category
      const existingCategory = await db
        .select()
        .from(knowledgeCategories)
        .where(eq(knowledgeCategories.name, "Support Q&A"))
        .limit(1);
      
      if (existingCategory.length > 0) {
        finalCategoryId = existingCategory[0].id;
      } else {
        // Create new "Support Q&A" category
        const [newCategory] = await db
          .insert(knowledgeCategories)
          .values({
            name: "Support Q&A",
            description: "FAQ được tạo từ các yêu cầu hỗ trợ thực tế",
          })
          .returning();
        finalCategoryId = newCategory.id;
      }
    }

    // Create FAQ item
    const [faqItem] = await db
      .insert(faqItems)
      .values({
        question: question.trim(),
        answer: answer.trim(),
        categoryId: finalCategoryId,
        keywords,
        isActive: true,
        priority: 1, // Higher priority for real support cases
      })
      .returning();

    // Update ticket to mark as converted to training data
    await this.updateSupportTicket(ticketId, {
      status: "closed"
    });

    return {
      faqId: faqItem.id,
      message: `Successfully converted support ticket to FAQ. Question: "${question.substring(0, 100)}..."`
    };
  }

  // Helper method to extract keywords from text
  private extractKeywordsFromText(text: string): string[] {
    // Convert to lowercase and remove special characters
    const cleanText = text.toLowerCase()
      .replace(/[^\wàáâãèéêìíòóôõùúăđĩũơưạảấầẩẫậắằẳẵặẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Common Vietnamese stop words to exclude
    const stopWords = new Set([
      'của', 'và', 'có', 'là', 'trong', 'để', 'với', 'được', 'từ', 'trên', 'cho', 'về', 'các', 'này', 'đó', 'không', 'tôi', 'bạn', 'chúng', 'người', 'việc', 'thì', 'sẽ', 'đã', 'như', 'nào', 'gì', 'khi', 'tại', 'theo', 'sau', 'trước', 'giữa', 'ngoài', 'cũng', 'hay', 'hoặc', 'nhưng', 'mà', 'nếu', 'thế', 'rồi', 'đều', 'cả', 'những', 'nhiều', 'ít', 'lại', 'còn', 'chỉ', 'đang', 'đang', 'bằng', 'lên', 'xuống'
    ]);

    // Extract words of 3+ characters that aren't stop words
    const words = cleanText.split(' ')
      .filter(word => word.length >= 3 && !stopWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
      .slice(0, 10); // Take top 10 keywords

    return words;
  }

  // Theme settings operations
  async getAllThemeSettings(): Promise<ThemeSetting[]> {
    return await db.select().from(themeSettings).orderBy(themeSettings.createdAt);
  }

  async getActiveTheme(): Promise<ThemeSetting | undefined> {
    const [theme] = await db.select().from(themeSettings).where(eq(themeSettings.isActive, true));
    return theme;
  }

  async createThemeSetting(themeData: InsertThemeSetting): Promise<ThemeSetting> {
    const [theme] = await db
      .insert(themeSettings)
      .values(themeData)
      .returning();
    return theme;
  }

  async setActiveTheme(themeName: string): Promise<ThemeSetting> {
    console.log("DEBUG: Setting active theme to:", themeName);
    
    // Define predefined themes
    const predefinedThemes: Record<string, { displayName: string; description: string }> = {
      default: { displayName: "Mặc định", description: "Giao diện tiêu chuẩn của hệ thống" },
      tet: { displayName: "Tết Nguyên Đán", description: "Giao diện trang trí Tết truyền thống Việt Nam" },
      christmas: { displayName: "Giáng sinh", description: "Giao diện trang trí Giáng sinh với màu sắc ấm cúng" },
      halloween: { displayName: "Halloween", description: "Giao diện Halloween với màu cam đen huyền bí" },
      mid_autumn: { displayName: "Trung thu", description: "Giao diện Tết Trung thu với hình ảnh trăng sao" },
      teachers_day: { displayName: "Ngày Nhà giáo Việt Nam", description: "Giao diện tôn vinh ngày Nhà giáo 20/11" },
      school_opening: { displayName: "Ngày khai giảng", description: "Giao diện chào mừng năm học mới với tinh thần khởi đầu tươi mới" }
    };

    // First, deactivate all themes
    console.log("DEBUG: Deactivating all themes...");
    await db.update(themeSettings).set({ isActive: false });
    
    // Check if theme exists
    console.log("DEBUG: Checking if theme exists...");
    const [existingTheme] = await db
      .select()
      .from(themeSettings)
      .where(eq(themeSettings.themeName, themeName));
    
    console.log("DEBUG: Existing theme found:", existingTheme);
    
    let theme: ThemeSetting;
    
    if (existingTheme) {
      // Theme exists, just activate it
      console.log("DEBUG: Activating existing theme...");
      const [updatedTheme] = await db
        .update(themeSettings)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(themeSettings.themeName, themeName))
        .returning();
      theme = updatedTheme;
      console.log("DEBUG: Theme activated:", theme);
    } else {
      // Theme doesn't exist, create it first
      const themeInfo = predefinedThemes[themeName];
      if (!themeInfo) {
        throw new Error(`Unknown theme: ${themeName}`);
      }
      
      console.log("DEBUG: Creating new theme with info:", themeInfo);
      const [newTheme] = await db
        .insert(themeSettings)
        .values({
          themeName,
          displayName: themeInfo.displayName,
          description: themeInfo.description,
          isActive: true,
        })
        .returning();
      theme = newTheme;
      console.log("DEBUG: New theme created:", theme);
    }
    
    // Double check active theme
    const [activeCheck] = await db.select().from(themeSettings).where(eq(themeSettings.isActive, true));
    console.log("DEBUG: Final active theme check:", activeCheck);
    
    return theme;
  }
}

export const storage = new DatabaseStorage();
