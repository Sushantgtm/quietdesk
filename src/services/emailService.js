/**
 * Email Service for Quiet Desk
 * 
 * Handles sending student reservation confirmation emails upon admin approval.
 * Securely uses backend endpoint if defined in environment variables.
 */

export const sendReservationConfirmationEmail = async ({
  studentName,
  studentEmail,
  seatNumber,
  passType,
  startDate,
  endDate,
  hasLocker,
  lockerNumber,
  totalAmount,
  amountPaid,
  pendingAmount,
  bookingCode
}) => {
  if (!studentEmail || !studentEmail.includes('@') || studentEmail.endsWith('@student.quietdesk.local')) {
    return {
      sent: false,
      reason: 'No valid recipient email address provided.'
    };
  }

  const emailEndpoint = import.meta.env.VITE_EMAIL_ENDPOINT;

  const emailPayload = {
    to: studentEmail,
    subject: `Your Desk Reservation is Confirmed! (Desk #${seatNumber}) — The Quiet Desk`,
    bookingCode: bookingCode || '',
    studentName: studentName || 'Scholar',
    seatNumber,
    passType: passType || 'DAILY',
    startDate,
    endDate,
    hasLocker: !!hasLocker,
    lockerNumber: lockerNumber || 'N/A',
    totalAmount: Number(totalAmount) || 0,
    amountPaid: Number(amountPaid) || 0,
    pendingAmount: Number(pendingAmount) || 0,
    timestamp: new Date().toISOString()
  };

  if (!emailEndpoint) {
    console.info(
      '[Email Service] Email service endpoint not configured (missing VITE_EMAIL_ENDPOINT). Email payload ready:',
      emailPayload
    );
    return {
      sent: false,
      reason: 'Email backend not configured (missing VITE_EMAIL_ENDPOINT in environment).'
    };
  }

  try {
    const res = await fetch(emailEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!res.ok) {
      throw new Error(`Email server returned ${res.status}: ${res.statusText}`);
    }

    return { sent: true };
  } catch (err) {
    console.error('[Email Service] Failed to send confirmation email:', err);
    return {
      sent: false,
      reason: err.message
    };
  }
};
