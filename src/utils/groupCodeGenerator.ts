/**
 * Generates a unique 6-digit numeric group code
 */
export const generateGroupCode = (existingCodes: string[]): string => {
  let code: string;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    // Generate random 6-digit number (000000-999999)
    code = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;
    
    if (attempts >= maxAttempts) {
      // Fallback: use timestamp-based code if too many collisions
      code = Date.now().toString().slice(-6);
      break;
    }
  } while (existingCodes.includes(code));

  return code;
};

/**
 * Creates a deep link for joining a group
 */
export const createGroupInviteLink = (code: string): string => {
  return `offerbound://join/${code}`;
};


