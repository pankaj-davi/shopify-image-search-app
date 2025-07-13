import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { databaseConfig } from '../config/database.config';

let firestore: Firestore | null = null;

export function initializeFirebase(): Firestore {
  if (firestore) {
    return firestore;
  }

  try {
    // Check if Firebase app is already initialized
    const apps = getApps();
    let app;

    if (apps.length === 0) {
      // Initialize Firebase Admin SDK
      const { firebase } = databaseConfig;
      
      if (!firebase?.projectId) {
        throw new Error('Firebase project ID is required. Please set FIREBASE_PROJECT_ID environment variable.');
      }

      // For server-side usage with service account
      if (firebase.clientEmail && firebase.privateKey) {
        app = initializeApp({
          credential: cert({
            projectId: firebase.projectId,
            clientEmail: firebase.clientEmail,
            privateKey: firebase.privateKey,
          }),
          databaseURL: firebase.databaseURL,
        });
      } else {
        // For development with application default credentials
        app = initializeApp({
          projectId: firebase.projectId,
          databaseURL: firebase.databaseURL,
        });
      }
    } else {
      app = apps[0];
    }

    firestore = getFirestore(app);
    console.log('🔥 Firebase initialized successfully');
    return firestore;
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    throw error;
  }
}

export function getFirestoreInstance(): Firestore {
  if (!firestore) {
    return initializeFirebase();
  }
  return firestore;
}
