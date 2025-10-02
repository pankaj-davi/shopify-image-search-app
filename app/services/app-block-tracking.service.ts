import { getDatabase } from './database.interface';

export interface AppBlockUsageData {
  shopDomain: string;
  action: 'added' | 'removed' | 'used' | 'viewed' | 'loaded';
  url: string;
  userAgent: string;
  metadata: any;
  timestamp: string;
}
export class AppBlockTrackingService {
  private static readonly USER_AGENT_MAX_LENGTH = 500;
  private database: any = null;

  private async getDB() {
    if (!this.database) {
      this.database = await getDatabase();
    }
    return this.database;
  }

  async trackAppBlockUsage(data: AppBlockUsageData): Promise<string> {
    try {
      const db = await this.getDB();
      
      // Parse the timestamp properly
      let finalTimestamp: Date;
      if (data.timestamp) {
        finalTimestamp = new Date(data.timestamp);
      } else {
        finalTimestamp = new Date();
      }
      
      const usageRecord = {
        shopDomain: data.shopDomain,
        action: data.action,
        url: data.url || null,
        userAgent: data.userAgent ? data.userAgent.substring(0, AppBlockTrackingService.USER_AGENT_MAX_LENGTH) : null, // Limit length
        metadata: data.metadata ? (typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata)) : null,
        timestamp: finalTimestamp.toISOString()
      };

      const result = await db.createAppBlockUsage(usageRecord);
      return result.id;
    } catch (error) {
      console.error('❌ Failed to track app block usage:', error);
      throw error;
    }
  }
}

// Singleton instance
export const appBlockTracker = new AppBlockTrackingService();
