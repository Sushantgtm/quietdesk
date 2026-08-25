import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const LOCAL_ADMIN_KEY = 'quietdesk_admin_v1';

export const getCurrentAdmin = () => {
  const stored = localStorage.getItem(LOCAL_ADMIN_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse cached admin profile', e);
    }
  }
  return null;
};

export const subscribeAuthState = (onAuthUpdate) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      const adminProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: 'Branch Manager',
        branch: 'Lazimpat Branch'
      };
      localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(adminProfile));
      onAuthUpdate(adminProfile);
    } else {
      const cached = getCurrentAdmin();
      onAuthUpdate(cached);
    }
  });
};

export const loginAdmin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const adminProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Branch Manager',
      role: 'Branch Manager',
      branch: 'Lazimpat Branch'
    };
    
    // Log login document to Firestore admins collection
    await setDoc(doc(db, 'admins', user.uid), {
      ...adminProfile,
      lastLogin: new Date().toISOString()
    }, { merge: true });

    localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(adminProfile));
    return adminProfile;
  } catch (error) {
    console.warn('Firebase Auth attempt fallback check:', error.message);
    
    // Supported manual admin email/password combinations
    const validCredentials = [
      { email: 'admin@quietdesk.np', pass: 'lazimpat2026', name: 'Branch Manager (Lazimpat)' },
      { email: 'admin@quietdesk.com', pass: 'quietdesk2026', name: 'Admin Manager' },
      { email: 'manager@quietdesk.np', pass: 'admin123', name: 'Operations Director' }
    ];

    const matched = validCredentials.find(c => c.email.toLowerCase() === email.toLowerCase() && c.pass === password);

    if (matched) {
      const fallbackAdmin = {
        uid: 'admin-' + matched.email.replace(/[@.]/g, '-'),
        email: matched.email,
        displayName: matched.name,
        role: 'Branch Manager',
        branch: 'Lazimpat Branch'
      };

      // Try logging fallback admin doc to Firestore
      try {
        await setDoc(doc(db, 'admins', fallbackAdmin.uid), {
          ...fallbackAdmin,
          lastLogin: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Unable to log admin doc to Firestore:', e);
      }

      localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(fallbackAdmin));
      return fallbackAdmin;
    }

    throw new Error('Invalid email or password credentials. Please use provided admin credentials.');
  }
};

export const logoutAdmin = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Signout warning:', e.message);
  }
  localStorage.removeItem(LOCAL_ADMIN_KEY);
};
