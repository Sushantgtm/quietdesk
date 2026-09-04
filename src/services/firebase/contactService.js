import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const submitContactInquiry = async ({ name, email, phone, message }) => {
  const inquiry = {
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    message: message.trim(),
    status: 'new',
    created_at: serverTimestamp()
  };

  await addDoc(collection(db, 'contact_inquiries'), inquiry);
};

export const subscribeContactInquiries = (onInquiriesUpdate, onError) => {
  return onSnapshot(collection(db, 'contact_inquiries'), (snapshot) => {
    const inquiries = snapshot.docs
      .map((inquiryDoc) => ({ id: inquiryDoc.id, ...inquiryDoc.data() }))
      .sort((left, right) => {
        const leftTime = left.created_at?.toMillis?.() || 0;
        const rightTime = right.created_at?.toMillis?.() || 0;
        return rightTime - leftTime;
      });
    onInquiriesUpdate(inquiries);
  }, onError);
};

export const updateContactInquiryStatus = async (inquiryId, status) => {
  await updateDoc(doc(db, 'contact_inquiries', inquiryId), { status });
};

export const deleteContactInquiry = async (inquiryId) => {
  await deleteDoc(doc(db, 'contact_inquiries', inquiryId));
};
