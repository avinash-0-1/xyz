import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from 'dotenv';

dotenv.config();

function initFirebaseAdmin() {
  const apps = getApps();

  if (!apps.length) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
       console.warn("⚠️ Firebase Admin environment variables missing! Using MOCK database. Data will NOT be saved.");
       
       // Return Mock DB/Auth
       const mockDb: any = {
         collection: (name: string) => ({
           add: async (data: any) => { 
             console.log(`[MOCK DB] Added document to '${name}':`, data); 
             return { id: "mock-id-" + Date.now() }; 
           },
           doc: (id?: string) => ({
             set: async (data: any) => { 
               console.log(`[MOCK DB] Set document '${id || 'auto-id'}' in '${name}':`, data); 
             },
             get: async () => ({ exists: false, data: () => undefined }),
           }),
           where: () => mockDb.collection(name),
           orderBy: () => mockDb.collection(name),
           limit: () => mockDb.collection(name),
           get: async () => ({ empty: true, docs: [] }),
         })
       };

       const mockAuth: any = {};

       return { auth: mockAuth, db: mockDb };
    } else {
        initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
        });
    }
  }

  return {
    auth: getAuth(),
    db: getFirestore(),
  };
}

export const { auth, db } = initFirebaseAdmin();
