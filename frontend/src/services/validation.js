export const ValidationEngine = {
  EMAIL_REGEX: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
  PHONE_REGEX: /^[6-9]\d{9}$/,
  PASSWORD_POLICY: {
    minLength: 8,
    hasUpper: /[A-Z]/,
    hasLower: /[a-z]/,
    hasDigit: /\d/,
    hasSpecial: /[^a-zA-Z0-9]/
  },

  validateRequired(value, fieldName = 'This field') {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      return { valid: false, message: `${fieldName} is required.` };
    }
    return { valid: true };
  },

  validateEmail(email) {
    const req = this.validateRequired(email, 'Email address');
    if (!req.valid) return req;
    if (!this.EMAIL_REGEX.test(email.trim())) {
      return { valid: false, message: 'Enter a valid email address (e.g. user@example.com).' };
    }
    return { valid: true };
  },

  validatePhone(phone) {
    const req = this.validateRequired(phone, 'Phone number');
    if (!req.valid) return req;
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (!this.PHONE_REGEX.test(cleaned)) {
      return { valid: false, message: 'Enter a valid 10-digit mobile number (starting with 6-9).' };
    }
    return { valid: true };
  },

  checkPasswordStrength(password) {
    const rules = {
      length: (password || '').length >= this.PASSWORD_POLICY.minLength,
      upper: this.PASSWORD_POLICY.hasUpper.test(password || ''),
      lower: this.PASSWORD_POLICY.hasLower.test(password || ''),
      digit: this.PASSWORD_POLICY.hasDigit.test(password || ''),
      special: this.PASSWORD_POLICY.hasSpecial.test(password || '')
    };

    let passedCount = 0;
    if (rules.length) passedCount++;
    if (rules.upper) passedCount++;
    if (rules.lower) passedCount++;
    if (rules.digit) passedCount++;
    if (rules.special) passedCount++;

    let level = 'weak';
    if (passedCount >= 5) level = 'strong';
    else if (passedCount >= 4) level = 'good';
    else if (passedCount >= 2) level = 'fair';

    return {
      isValid: passedCount === 5,
      rules,
      level,
      message: passedCount === 5 ? 'Password meets all enterprise security requirements.' : 'Password does not meet complexity requirements.'
    };
  }
};
