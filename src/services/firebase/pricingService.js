import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { ACCESS_PLANS } from '../mock/mockData';

const LOCAL_STORAGE_PLANS_KEY = 'quietdesk_plans_v2';

export const getLocalPlans = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_PLANS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse local pricing plans', e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_PLANS_KEY, JSON.stringify(ACCESS_PLANS));
  return ACCESS_PLANS;
};

export const saveLocalPlans = (plans) => {
  localStorage.setItem(LOCAL_STORAGE_PLANS_KEY, JSON.stringify(plans));
};

export const seedPlansToFirestore = async () => {
  try {
    for (const plan of ACCESS_PLANS) {
      await setDoc(doc(db, 'plans', plan.id), plan, { merge: true });
    }
    console.log('Successfully seeded pricing plans to Firestore');
  } catch (e) {
    console.warn('Unable to seed Firestore plans:', e.message);
  }
};

export const subscribePlans = (onPlansUpdate) => {
  let unsub = () => {};
  try {
    const plansRef = collection(db, 'plans');
    unsub = onSnapshot(plansRef, (snapshot) => {
      if (snapshot.empty) {
        seedPlansToFirestore();
        onPlansUpdate(getLocalPlans());
      } else {
        const firestorePlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        saveLocalPlans(firestorePlans);
        onPlansUpdate(firestorePlans);
      }
    }, (error) => {
      console.warn('Firestore plans subscription fallback to local state:', error.message);
      onPlansUpdate(getLocalPlans());
    });
  } catch (e) {
    console.warn('Firestore offline fallback for plans:', e);
    onPlansUpdate(getLocalPlans());
  }

  const handleLocalChange = () => onPlansUpdate(getLocalPlans());
  window.addEventListener('storage', handleLocalChange);

  return () => {
    unsub();
    window.removeEventListener('storage', handleLocalChange);
  };
};

export const createPlan = async (planData) => {
  const planId = planData.id || ('plan_' + Date.now());
  const newPlan = {
    id: planId,
    status: 'ACTIVE',
    ...planData
  };

  const currentLocal = getLocalPlans();
  const updatedLocal = [...currentLocal, newPlan];
  saveLocalPlans(updatedLocal);

  try {
    await setDoc(doc(db, 'plans', planId), newPlan, { merge: true });
    return newPlan;
  } catch (e) {
    console.warn('Firestore createPlan fallback to local:', e.message);
    return newPlan;
  }
};

export const updatePlan = async (planId, updatedFields) => {
  const currentLocal = getLocalPlans();
  const updatedLocal = currentLocal.map(p => p.id === planId ? { ...p, ...updatedFields } : p);
  saveLocalPlans(updatedLocal);

  try {
    const planRef = doc(db, 'plans', planId);
    await updateDoc(planRef, { ...updatedFields, updatedAt: new Date().toISOString() });
    return true;
  } catch (e) {
    console.warn('Firestore updatePlan fallback to local:', e.message);
    return false;
  }
};

export const deletePlan = async (planId) => {
  const currentLocal = getLocalPlans();
  const updatedLocal = currentLocal.filter(p => p.id !== planId);
  saveLocalPlans(updatedLocal);

  try {
    const planRef = doc(db, 'plans', planId);
    await deleteDoc(planRef);
    return true;
  } catch (e) {
    console.warn('Firestore deletePlan fallback to local:', e.message);
    return false;
  }
};

