// Firestore session storage for serverless environments
import type { SessionStorage } from "@shopify/shopify-app-session-storage";
import { Session } from "@shopify/shopify-api";

class FirestoreSessionStorage implements SessionStorage {
  private firestorePromise: Promise<any> | null = null;
  readonly ready = Promise.resolve();

  private async getFirestore() {
    if (!this.firestorePromise) {
      this.firestorePromise = (async () => {
        try {
          const { initializeFirebase } = await import("./services/firebase.service");
          return initializeFirebase();
        } catch (error) {
          console.error("Failed to initialize Firebase:", error);
          // Reset promise so it can be retried
          this.firestorePromise = null;
          throw error;
        }
      })();
    }
    return this.firestorePromise;
  }

  async storeSession(session: Session): Promise<boolean> {
    try {
      console.log(`📝 Attempting to store session: ${session.id} for shop: ${session.shop}`);
      const firestore = await this.getFirestore();
      const sessionData = JSON.parse(JSON.stringify(session)); // Serialize session
      await firestore
        .collection("stores")
        .doc(session.shop)
        .collection("sessions")
        .doc(session.id)
        .set({
          ...sessionData,
          updatedAt: new Date().toISOString(),
        });
      console.log(`✅ Session stored in Firestore: ${session.id} for shop: ${session.shop}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to store session ${session.id}:`, error);
      return false;
    }
  }

  async loadSession(id: string): Promise<Session | undefined> {
    try {
      console.log(`🔍 Attempting to load session: ${id}`);
      const firestore = await this.getFirestore();

      // Query across all stores' sessions subcollections
      const storesSnapshot = await firestore.collection("stores").get();

      for (const storeDoc of storesSnapshot.docs) {
        const sessionDoc = await firestore
          .collection("stores")
          .doc(storeDoc.id)
          .collection("sessions")
          .doc(id)
          .get();

        if (sessionDoc.exists) {
          const data = sessionDoc.data();
          console.log(`✅ Session loaded from Firestore: ${id} for shop: ${data?.shop}`);

          // Reconstruct the Session object with proper methods
          return new Session({
            id: data.id,
            shop: data.shop,
            state: data.state,
            isOnline: data.isOnline,
            scope: data.scope,
            accessToken: data.accessToken,
            expires: data.expires ? new Date(data.expires) : undefined,
            onlineAccessInfo: data.onlineAccessInfo,
          });
        }
      }

      console.log(`❌ Session NOT FOUND in Firestore: ${id}`);
      return undefined;
    } catch (error) {
      console.error(`❌ Failed to load session ${id} from Firestore:`, error);
      return undefined;
    }
  }

  async deleteSession(id: string): Promise<boolean> {
    try {
      const firestore = await this.getFirestore();

      // Query across all stores' sessions subcollections
      const storesSnapshot = await firestore.collection("stores").get();

      for (const storeDoc of storesSnapshot.docs) {
        const sessionDoc = await firestore
          .collection("stores")
          .doc(storeDoc.id)
          .collection("sessions")
          .doc(id)
          .get();

        if (sessionDoc.exists) {
          await sessionDoc.ref.delete();
          console.log(`🗑️ Session deleted from Firestore: ${id}`);
          return true;
        }
      }

      console.log(`⚠️ Session not found for deletion: ${id}`);
      return false;
    } catch (error) {
      console.error("Failed to delete session from Firestore:", error);
      return false;
    }
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    try {
      const firestore = await this.getFirestore();
      const batch = firestore.batch();
      const storesSnapshot = await firestore.collection("stores").get();

      for (const storeDoc of storesSnapshot.docs) {
        for (const id of ids) {
          const sessionRef = firestore
            .collection("stores")
            .doc(storeDoc.id)
            .collection("sessions")
            .doc(id);
          batch.delete(sessionRef);
        }
      }

      await batch.commit();
      console.log(`🗑️ ${ids.length} sessions deleted from Firestore`);
      return true;
    } catch (error) {
      console.error("Failed to delete sessions from Firestore:", error);
      return false;
    }
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    try {
      const firestore = await this.getFirestore();
      const snapshot = await firestore
        .collection("stores")
        .doc(shop)
        .collection("sessions")
        .get();

      const results = snapshot.docs.map((doc) => {
        const data = doc.data();
        return new Session({
          id: data.id,
          shop: data.shop,
          state: data.state,
          isOnline: data.isOnline,
          scope: data.scope,
          accessToken: data.accessToken,
          expires: data.expires ? new Date(data.expires) : undefined,
          onlineAccessInfo: data.onlineAccessInfo,
        });
      });
      console.log(`🔍 Found ${results.length} sessions for shop ${shop} in Firestore`);
      return results;
    } catch (error) {
      console.error("Failed to find sessions by shop from Firestore:", error);
      return [];
    }
  }

  async updateSessionScope(shop: string, newScope: string): Promise<boolean> {
    try {
      console.log(`🔄 Updating session scope for shop: ${shop}`);
      const firestore = await this.getFirestore();
      const snapshot = await firestore
        .collection("stores")
        .doc(shop)
        .collection("sessions")
        .get();

      if (snapshot.empty) {
        console.log(`⚠️ No sessions found for shop: ${shop}`);
        return false;
      }

      // Update all sessions for this shop
      const batch = firestore.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          scope: newScope,
          updatedAt: new Date().toISOString(),
        });
      });

      await batch.commit();
      console.log(`✅ Updated scope for ${snapshot.docs.length} session(s) for shop: ${shop}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update session scope for shop ${shop}:`, error);
      return false;
    }
  }
}

export const sessionStorage = new FirestoreSessionStorage();