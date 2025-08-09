import { getDatabase } from './database.interface';

export interface AppBlockUsageData {
  shopDomain: string;
  blockType: string;
  action: 'added' | 'removed' | 'used' | 'viewed';
  url?: string;
  userAgent?: string;
  metadata?: any;
  sessionId?: string;
}

export interface VisualSearchUsageData {
  shopDomain: string;
  searchType: 'image_upload' | 'crop_search' | 'url_input' | 'camera';
  hasResults: boolean;
  resultCount: number;
  imageSize?: number;
  imageType?: string;
  cropData?: any;
  sessionId?: string;
  url?: string;
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

  // Track app block usage events
  async trackAppBlockUsage(data: AppBlockUsageData): Promise<string> {
    try {
      const db = await this.getDB();
      
      const usageRecord = {
        shopDomain: data.shopDomain,
        blockType: data.blockType,
        action: data.action,
        url: data.url || null,
        userAgent: data.userAgent ? data.userAgent.substring(0, AppBlockTrackingService.USER_AGENT_MAX_LENGTH) : null, // Limit length
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        sessionId: data.sessionId || null,
        timestamp: new Date()
      };

      const result = await db.createAppBlockUsage(usageRecord);
      
      console.log(`📊 App block usage tracked:`, {
        id: result.id,
        shop: data.shopDomain,
        action: data.action,
        blockType: data.blockType
      });

      return result.id;
    } catch (error) {
      console.error('❌ Failed to track app block usage:', error);
      throw error;
    }
  }

  // Track visual search usage
  async trackVisualSearchUsage(data: VisualSearchUsageData): Promise<string> {
    try {
      const db = await this.getDB();
      
      const searchRecord = {
        shopDomain: data.shopDomain,
        searchType: data.searchType,
        hasResults: data.hasResults,
        resultCount: data.resultCount,
        imageSize: data.imageSize || null,
        imageType: data.imageType || null,
        cropData: data.cropData ? JSON.stringify(data.cropData) : null,
        sessionId: data.sessionId || null,
        url: data.url || null,
        timestamp: new Date()
      };

      const result = await db.createVisualSearchUsage(searchRecord);
      
      console.log(`🔍 Visual search usage tracked:`, {
        id: result.id,
        shop: data.shopDomain,
        searchType: data.searchType,
        hasResults: data.hasResults,
        resultCount: data.resultCount
      });

      return result.id;
    } catch (error) {
      console.error('❌ Failed to track visual search usage:', error);
      throw error;
    }
  }

  // Get app block usage statistics
  async getAppBlockStats(shopDomain: string, days: number = 30): Promise<any> {
    try {
      const db = await this.getDB();
      const since = new Date();
      since.setDate(since.getDate() - days);

      const stats = await db.getAppBlockUsageStats(shopDomain, since);
      
      return {
        totalUsage: stats.total || 0,
        byAction: stats.byAction || {},
        dailyUsage: stats.daily || [],
        lastUsed: stats.lastUsed || null
      };
    } catch (error) {
      console.error('❌ Failed to get app block stats:', error);
      return {
        totalUsage: 0,
        byAction: {},
        dailyUsage: [],
        lastUsed: null
      };
    }
  }

  // Get visual search statistics
  async getVisualSearchStats(shopDomain: string, days: number = 30): Promise<any> {
    try {
      const db = await this.getDB();
      const since = new Date();
      since.setDate(since.getDate() - days);

      const stats = await db.getVisualSearchUsageStats(shopDomain, since);
      
      return {
        totalSearches: stats.total || 0,
        successfulSearches: stats.successful || 0,
        bySearchType: stats.byType || {},
        averageResults: stats.avgResults || 0,
        dailySearches: stats.daily || []
      };
    } catch (error) {
      console.error('❌ Failed to get visual search stats:', error);
      return {
        totalSearches: 0,
        successfulSearches: 0,
        bySearchType: {},
        averageResults: 0,
        dailySearches: []
      };
    }
  }

  // Check if app block is actively used
  async isAppBlockActive(shopDomain: string, hours: number = 24): Promise<boolean> {
    try {
      const db = await this.getDB();
      const since = new Date();
      since.setHours(since.getHours() - hours);

      const recentUsage = await db.getRecentAppBlockUsage(shopDomain, since);
      
      return recentUsage && recentUsage.length > 0;
    } catch (error) {
      console.error('❌ Failed to check app block activity:', error);
      return false;
    }
  }
}

// Singleton instance
export const appBlockTracker = new AppBlockTrackingService();
