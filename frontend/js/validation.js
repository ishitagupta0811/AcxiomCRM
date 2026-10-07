/**
 * AcxiomCRM — Client-Side Validation Engine
 * Complies with Section 5.1 & 17.8: Required, Email, Phone, Length, Password Complexity
 */

const ValidationEngine = {
  // RFC 5322 compatible email pattern
  EMAIL_REGEX: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

  // 10-Digit Mobile pattern (Section 5.1)
  PHONE_REGEX: /^[6-9]\d{9}$/,

  // Password Policy Regex (Section 6.2 & 17.9)
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

    // Remove any hyphens, spaces or parenthesis
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (!this.PHONE_REGEX.test(cleaned)) {
      return { valid: false, message: 'Enter a valid 10-digit mobile number (starting with 6-9).' };
    }
    return { valid: true };
  },

  validateLength(value, min, max, fieldName = 'Field') {
    if (!value) return { valid: true };
    const len = value.trim().length;
    if (min && len < min) {
      return { valid: false, message: `${fieldName} must be at least ${min} characters.` };
    }
    if (max && len > max) {
      return { valid: false, message: `${fieldName} cannot exceed ${max} characters.` };
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

    const isValid = passedCount === 5;
    return {
      isValid,
      rules,
      level,
      message: isValid ? 'Password meets all enterprise security requirements.' : 'Password does not meet complexity requirements.'
    };
  },

  // UI Helper: Marks an input field as valid or invalid
  setFieldState(inputElement, feedbackElement, result) {
    if (!inputElement) return;

    if (!result.valid) {
      inputElement.classList.add('is-invalid');
      inputElement.classList.remove('is-valid');
      if (feedbackElement) {
        feedbackElement.textContent = result.message;
        feedbackElement.classList.add('error');
      }
    } else {
      inputElement.classList.remove('is-invalid');
      inputElement.classList.add('is-valid');
      if (feedbackElement) {
        feedbackElement.textContent = '';
        feedbackElement.classList.remove('error');
      }
    }
  }
};
