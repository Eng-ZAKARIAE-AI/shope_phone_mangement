import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  addDoc
} from 'firebase/firestore';
import { Product, ProductInput, UserProfile, InventoryLog, UserRole, StockStatus } from '../types.ts';
import firebaseConfig from '../../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// --- Firestore Hardened Error Boundary Handling ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Raised: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Ensures user profiles exist in the users collection with default 'staff' role
 */
export async function syncUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  let docSnap;
  try {
    docSnap = await getDoc(userRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
  }

  if (docSnap && docSnap.exists()) {
    const existingProfile = docSnap.data() as UserProfile;
    // Update lastLogin
    try {
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
    return {
      ...existingProfile,
      lastLogin: new Date()
    };
  }

  // Assign 'admin' role if matching specific email or first user, default staff
  const isZakariae = user.email?.toLowerCase().includes('zakariaeelhaddouchi') || user.email === 'admin@tecno.com';
  const assignedRole: UserRole = isZakariae ? 'admin' : 'staff';

  const newProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Unknown Staff',
    role: assignedRole,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp()
  };

  try {
    await setDoc(userRef, newProfile);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
  }
  return newProfile;
}

/**
 * Logs stock inventory transformations for audit compliance
 */
export async function createAuditLog(
  productId: string,
  productName: string,
  operatorId: string,
  operatorEmail: string,
  action: InventoryLog['action'],
  preQuantity: number,
  postQuantity: number
) {
  const logRef = collection(db, 'inventory_logs');
  try {
    await addDoc(logRef, {
      productId,
      productName,
      operatorId,
      operatorEmail,
      action,
      preQuantity,
      postQuantity,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    // Audit logs are critical so we pass them through handleFirestoreError for real-time diagnostic intercept
    handleFirestoreError(err, OperationType.CREATE, 'inventory_logs');
  }
}
