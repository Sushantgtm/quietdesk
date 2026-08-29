import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export const INITIAL_FAQS = [
  {
    id: 'faq_cabin_size',
    question: 'what is the size of the cabin ??',
    answer: '3 feet enough to put laptop books and write note at the same time and space at the top to put your things',
    order: 1
  }
];

const LOCAL_STORAGE_FAQS_KEY = 'quietdesk_faqs_v1';

export const getLocalFaqs = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_FAQS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse local FAQs', e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_FAQS_KEY, JSON.stringify(INITIAL_FAQS));
  return INITIAL_FAQS;
};

export const saveLocalFaqs = (faqs) => {
  localStorage.setItem(LOCAL_STORAGE_FAQS_KEY, JSON.stringify(faqs));
};

export const seedFaqsToFirestore = async () => {
  try {
    for (const faq of INITIAL_FAQS) {
      await setDoc(doc(db, 'faqs', faq.id), faq, { merge: true });
    }
    console.log('Successfully seeded FAQs to Firestore');
  } catch (e) {
    console.warn('Unable to seed Firestore FAQs:', e.message);
  }
};

export const subscribeFaqs = (onFaqsUpdate) => {
  let unsub = () => {};
  try {
    const faqsRef = collection(db, 'faqs');
    unsub = onSnapshot(faqsRef, (snapshot) => {
      if (snapshot.empty) {
        seedFaqsToFirestore();
        onFaqsUpdate(getLocalFaqs());
      } else {
        const firestoreFaqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by order ascending
        firestoreFaqs.sort((a, b) => (a.order || 99) - (b.order || 99));
        saveLocalFaqs(firestoreFaqs);
        onFaqsUpdate(firestoreFaqs);
      }
    }, (error) => {
      console.warn('Firestore FAQs subscription fallback to local state:', error.message);
      onFaqsUpdate(getLocalFaqs());
    });
  } catch (e) {
    console.warn('Firestore offline fallback for FAQs:', e);
    onFaqsUpdate(getLocalFaqs());
  }

  const handleLocalChange = () => onFaqsUpdate(getLocalFaqs());
  window.addEventListener('storage', handleLocalChange);

  return () => {
    unsub();
    window.removeEventListener('storage', handleLocalChange);
  };
};

export const createFaqInFirestore = async (faqData) => {
  const faqId = faqData.id || ('faq_' + Date.now());
  const newFaq = {
    id: faqId,
    order: Date.now(),
    ...faqData
  };

  const currentLocal = getLocalFaqs();
  const updatedLocal = [...currentLocal, newFaq];
  saveLocalFaqs(updatedLocal);

  try {
    await setDoc(doc(db, 'faqs', faqId), newFaq, { merge: true });
    return newFaq;
  } catch (e) {
    console.warn('Firestore createFaq fallback to local:', e.message);
    return newFaq;
  }
};

export const updateFaqInFirestore = async (faqId, updatedFields) => {
  const currentLocal = getLocalFaqs();
  const updatedLocal = currentLocal.map(f => f.id === faqId ? { ...f, ...updatedFields } : f);
  saveLocalFaqs(updatedLocal);

  try {
    const faqRef = doc(db, 'faqs', faqId);
    await updateDoc(faqRef, { ...updatedFields, updatedAt: new Date().toISOString() });
    return true;
  } catch (e) {
    console.warn('Firestore updateFaq fallback to local:', e.message);
    return false;
  }
};

export const deleteFaqFromFirestore = async (faqId) => {
  const currentLocal = getLocalFaqs();
  const updatedLocal = currentLocal.filter(f => f.id !== faqId);
  saveLocalFaqs(updatedLocal);

  try {
    const faqRef = doc(db, 'faqs', faqId);
    await deleteDoc(faqRef);
    return true;
  } catch (e) {
    console.warn('Firestore deleteFaq fallback to local:', e.message);
    return false;
  }
};
