import { storage } from "./storage";

// Auto-disable inactive users after 168 hours (7 days)
export class SessionService {
  private static instance: SessionService;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  // Start the background job to check for inactive users
  public start(): void {
    if (this.intervalId) {
      console.log("Session service already running");
      return;
    }

    console.log("🔐 Starting session management service...");
    
    // Run immediately on start
    this.checkAndDisableInactiveUsers();

    // Then run every hour
    this.intervalId = setInterval(() => {
      this.checkAndDisableInactiveUsers();
    }, 60 * 60 * 1000); // 1 hour interval

    console.log("✅ Session management service started");
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("🛑 Session management service stopped");
    }
  }

  // Check for users inactive for 168 hours (7 days) and disable them
  private async checkAndDisableInactiveUsers(): Promise<void> {
    try {
      console.log("🔍 Checking for inactive users...");

      // Find users inactive for 7 days (168 hours)
      const inactiveUsers = await storage.findInactiveUsers(7);
      
      if (inactiveUsers.length === 0) {
        console.log("✅ No inactive users found");
        return;
      }

      console.log(`⚠️ Found ${inactiveUsers.length} inactive users to disable`);

      // Disable each inactive user
      let disabledCount = 0;
      for (const user of inactiveUsers) {
        try {
          await storage.toggleUserActive(user.id, false);
          
          // Log the deactivation activity
          await storage.createActivity({
            userId: user.id,
            type: "system",
            description: `Tài khoản ${user.firstName} ${user.lastName} bị vô hiệu hóa tự động do không hoạt động quá 7 ngày`,
            metadata: {
              email: user.email,
              lastLoginAt: user.lastLoginAt,
              reason: "auto_disable_inactive",
              disabledAt: new Date().toISOString(),
            },
            ipAddress: null,
            userAgent: "System Auto-Disable Service",
          });

          disabledCount++;
          console.log(`🔒 Disabled user: ${user.email} (last login: ${user.lastLoginAt || 'never'})`);
        } catch (error) {
          console.error(`❌ Error disabling user ${user.email}:`, error);
        }
      }

      console.log(`✅ Successfully disabled ${disabledCount}/${inactiveUsers.length} inactive users`);
    } catch (error) {
      console.error("❌ Error in session service:", error);
    }
  }

  // Manual check - can be called by admin
  public async forceCheck(): Promise<{ disabled: number; errors: string[] }> {
    try {
      const inactiveUsers = await storage.findInactiveUsers(7);
      const errors: string[] = [];
      let disabledCount = 0;

      for (const user of inactiveUsers) {
        try {
          await storage.toggleUserActive(user.id, false);
          await storage.createActivity({
            userId: user.id,
            type: "admin",
            description: `Tài khoản ${user.firstName} ${user.lastName} bị vô hiệu hóa thủ công do không hoạt động`,
            metadata: {
              email: user.email,
              lastLoginAt: user.lastLoginAt,
              reason: "manual_disable_inactive",
              disabledAt: new Date().toISOString(),
            },
            ipAddress: null,
            userAgent: "Manual Admin Action",
          });
          disabledCount++;
        } catch (error) {
          errors.push(`Error disabling ${user.email}: ${error}`);
        }
      }

      return { disabled: disabledCount, errors };
    } catch (error) {
      throw new Error(`Session service force check failed: ${error}`);
    }
  }
}

// Export singleton instance
export const sessionService = SessionService.getInstance();