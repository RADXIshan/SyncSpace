import sql from "../database/db.js";

export class OnlineUsersDB {
  // Set user as online
  static async setUserOnline(userId, userData) {
    try {
      await sql`
        INSERT INTO online_users (user_id, name, email, photo, org_id, last_seen)
        VALUES (${userId}, ${userData.name}, ${userData.email}, ${userData.photo}, ${userData.org_id}, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          name = ${userData.name},
          email = ${userData.email},
          photo = ${userData.photo},
          org_id = ${userData.org_id},
          last_seen = NOW()
      `;

      console.log(`✅ User ${userData.email} marked as online in database`);
    } catch (error) {
      console.error("Error setting user online:", error);
    }
  }

  // Set user as offline
  static async setUserOffline(userId) {
    try {
      await sql`
        DELETE FROM online_users WHERE user_id = ${userId}
      `;

      console.log(`❌ User ${userId} marked as offline in database`);
    } catch (error) {
      console.error("Error setting user offline:", error);
    }
  }

  // Get online users for an organization
  static async getOnlineUsersByOrg(orgId) {
    try {
      // Remove users who haven't been seen in the last 5 minutes
      await sql`
        DELETE FROM online_users 
        WHERE last_seen < NOW() - INTERVAL '5 minutes'
      `;

      const users = await sql`
        SELECT user_id as id, name, email, photo, last_seen
        FROM online_users 
        WHERE org_id = ${orgId}
        ORDER BY last_seen DESC
      `;

      return users;
    } catch (error) {
      console.error("Error getting online users:", error);
      return [];
    }
  }

  // Check if user is online
  static async isUserOnline(userId) {
    try {
      const [user] = await sql`
        SELECT user_id FROM online_users 
        WHERE user_id = ${userId} 
        AND last_seen > NOW() - INTERVAL '5 minutes'
      `;

      return !!user;
    } catch (error) {
      console.error("Error checking user online status:", error);
      return false;
    }
  }

  // Update user's last seen timestamp
  static async updateLastSeen(userId) {
    try {
      await sql`
        UPDATE online_users 
        SET last_seen = NOW() 
        WHERE user_id = ${userId}
      `;
    } catch (error) {
      console.error("Error updating last seen:", error);
    }
  }

  // Clean up old entries (call this periodically)
  static async cleanup() {
    try {
      const result = await sql`
        DELETE FROM online_users 
        WHERE last_seen < NOW() - INTERVAL '10 minutes'
      `;

      console.log(`🧹 Cleaned up ${result.length} old online user entries`);
    } catch (error) {
      console.error("Error cleaning up online users:", error);
    }
  }
}
