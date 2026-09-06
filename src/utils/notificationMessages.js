const getErrorCode = (error) => String(error?.code || '').toLowerCase();

export const getFriendlyErrorMessage = (error, fallback = 'Unable to complete this action.') => {
  const code = getErrorCode(error);
  const rawMessage = String(error?.message || '').toLowerCase();

  if (code.includes('permission-denied') || rawMessage.includes('permission')) {
    return "Unable to complete this action. You don't have permission to perform this operation.";
  }

  if (code.includes('network') || code.includes('unavailable') || rawMessage.includes('network')) {
    return 'Something went wrong. Please check your internet connection and try again.';
  }

  if (code.includes('already-exists') || rawMessage.includes('already exists') || rawMessage.includes('duplicate')) {
    return 'Student Already Exists. A student with this phone number or email already exists.';
  }

  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) {
    return 'Unable to sign in. Please check your email and password.';
  }

  return fallback;
};

export const getFriendlyErrorTitle = (error, fallback = 'Something went wrong') => {
  const code = getErrorCode(error);
  const rawMessage = String(error?.message || '').toLowerCase();

  if (code.includes('already-exists') || rawMessage.includes('already exists') || rawMessage.includes('duplicate')) {
    return 'Student Already Exists';
  }

  if (code.includes('network') || code.includes('unavailable') || rawMessage.includes('network')) {
    return 'Something went wrong';
  }

  return fallback;
};
