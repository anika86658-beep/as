/**
 * Bangladeshi Mobile Number Validator & Operator Identifier
 *
 * Valid Operators:
 * - 013: Grameenphone (Skitto)
 * - 014: Banglalink
 * - 015: Teletalk
 * - 016: Airtel (Robi)
 * - 017: Grameenphone
 * - 018: Robi
 * - 019: Banglalink
 */

export interface PhoneValidationResult {
  isValid: boolean;
  cleanPhone: string;
  errorMessage?: string;
  operatorName?: string;
}

export const BD_OPERATORS: Record<string, string> = {
  '013': 'Grameenphone (Skitto)',
  '014': 'Banglalink',
  '015': 'Teletalk',
  '016': 'Airtel / Robi',
  '017': 'Grameenphone',
  '018': 'Robi',
  '019': 'Banglalink',
};

/**
 * Normalizes input to an 11-digit Bangladeshi mobile number string.
 * Handles '+8801...', '8801...', '01...', etc.
 */
export function normalizeBdPhoneNumber(input: string): string {
  if (!input) return '';
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length === 13) {
    digits = digits.slice(2);
  }
  return digits.slice(0, 11);
}

/**
 * Strict validator for Bangladeshi mobile numbers.
 * Rejects invalid prefixes, wrong lengths, and fake/repetitive/sequential numbers.
 */
export function validateBangladeshiPhone(input: string): PhoneValidationResult {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      cleanPhone: '',
      errorMessage: 'মোবাইল নম্বরটি প্রদান করুন (Mobile number is required)',
    };
  }

  const digits = normalizeBdPhoneNumber(input);

  // Length check
  if (digits.length < 11) {
    return {
      isValid: false,
      cleanPhone: digits,
      errorMessage: `১১ ডিজিট সম্পূর্ণ করুন (বর্তমান: ${digits.length}/11 ডিজিট)`,
    };
  }

  if (digits.length > 11) {
    return {
      isValid: false,
      cleanPhone: digits,
      errorMessage: 'মোবাইল নম্বর সর্বোচ্চ ১১ ডিজিটের হতে হবে',
    };
  }

  // Prefix check
  const prefix = digits.substring(0, 3);
  const operatorName = BD_OPERATORS[prefix];

  if (!operatorName) {
    return {
      isValid: false,
      cleanPhone: digits,
      errorMessage: 'সঠিক বাংলাদেশি অপারেটর দিয়ে শুরু করুন (013, 014, 015, 016, 017, 018, 019)',
    };
  }

  // 1. Check for entire number with all identical digits (e.g. 11111111111, 22222222222, 00000000000)
  if (/^(\d)\1{10}$/.test(digits)) {
    return {
      isValid: false,
      cleanPhone: digits,
      errorMessage: 'ফেক বা একই ডিজিটের নম্বর গ্রহণযোগ্য নয়। আপনার আসল মোবাইল নম্বর দিন।',
    };
  }

  // Suffix (the last 8 digits after 01X)
  const suffix = digits.substring(3);

  // 2. Check if suffix is all identical digits (e.g. 01700000000, 01711111111, 01888888888)
  if (/^(\d)\1{7}$/.test(suffix)) {
    return {
      isValid: false,
      cleanPhone: digits,
      errorMessage: 'ফেক বা ডামি নম্বর গ্রহণযোগ্য নয়। সঠিক মোবাইল নম্বর দিন।',
    };
  }

  // 3. Check if 6 or more consecutive identical digits exist anywhere in the number (e.g. 01711111100)
  if (/(\d)\1{5,}/.test(digits)) {
    return {
      isValid: false,
      cleanPhone: digits,
      errorMessage: 'অকার্যকর নম্বর! পরপর ৬ বা ততোধিক একই ডিজিট গ্রহণযোগ্য নয়।',
    };
  }

  // 4. Check for sequential ascending or descending sequences in the 8-digit suffix
  const sequentialAsc = '0123456789012345';
  const sequentialDesc = '9876543210987654';
  if (sequentialAsc.includes(suffix) || sequentialDesc.includes(suffix)) {
    return {
      isValid: false,
      cleanPhone: digits,
      errorMessage: 'ক্রমিক ডামি নম্বর (যেমন 12345678) গ্রহণযোগ্য নয়। সঠিক নম্বর দিন।',
    };
  }

  // 5. Check for repetitive 2-digit patterns in suffix (e.g. 01712121212, 01801010101)
  if (/^(\d{2})\1{3}$/.test(suffix)) {
    return {
      isValid: false,
      cleanPhone: digits,
      errorMessage: 'পুনরাবৃত্তিমূলক ডামি নম্বর গ্রহণযোগ্য নয়। আপনার আসল নম্বর দিন।',
    };
  }

  // 6. Check for repetitive 4-digit pairs (e.g. 01712341234)
  if (/^(\d{4})\1$/.test(suffix)) {
    return {
      isValid: false,
      cleanPhone: digits,
      errorMessage: 'ডামি নম্বর গ্রহণযোগ্য নয়। অনুগ্রহ করে আপনার আসল মোবাইল নম্বর দিন।',
    };
  }

  return {
    isValid: true,
    cleanPhone: digits,
    operatorName,
  };
}
