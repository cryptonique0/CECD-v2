/**
 * Validation Service - Centralized input validation and data sanitization
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validationService = {
  /**
   * Validate incident title
   */
  validateTitle(title: string | undefined): ValidationResult {
    const errors: string[] = [];

    if (!title) {
      errors.push('Title is required');
    } else if (typeof title !== 'string') {
      errors.push('Title must be a string');
    } else if (title.trim().length < 3) {
      errors.push('Title must be at least 3 characters');
    } else if (title.length > 200) {
      errors.push('Title cannot exceed 200 characters');
    }

    return { isValid: errors.length === 0, errors };
  },

  /**
   * Validate incident description
   */
  validateDescription(description: string | undefined): ValidationResult {
    const errors: string[] = [];

    if (!description) {
      errors.push('Description is required');
    } else if (typeof description !== 'string') {
      errors.push('Description must be a string');
    } else if (description.trim().length < 10) {
      errors.push('Description must be at least 10 characters');
    } else if (description.length > 5000) {
      errors.push('Description cannot exceed 5000 characters');
    }

    return { isValid: errors.length === 0, errors };
  },

  /**
   * Validate GPS coordinates
   */
  validateCoordinates(lat: number | undefined, lng: number | undefined): ValidationResult {
    const errors: string[] = [];

    if (lat === undefined || lat === null) {
      errors.push('Latitude is required');
    } else if (!Number.isFinite(lat)) {
      errors.push('Latitude must be a valid number');
    } else if (lat < -90 || lat > 90) {
      errors.push('Latitude must be between -90 and 90');
    }

    if (lng === undefined || lng === null) {
      errors.push('Longitude is required');
    } else if (!Number.isFinite(lng)) {
      errors.push('Longitude must be a valid number');
    } else if (lng < -180 || lng > 180) {
      errors.push('Longitude must be between -180 and 180');
    }

    return { isValid: errors.length === 0, errors };
  },

  /**
   * Validate email address
   */
  validateEmail(email: string | undefined): ValidationResult {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      errors.push('Email is required');
    } else if (typeof email !== 'string') {
      errors.push('Email must be a string');
    } else if (!emailRegex.test(email)) {
      errors.push('Email format is invalid');
    } else if (email.length > 255) {
      errors.push('Email cannot exceed 255 characters');
    }

    return { isValid: errors.length === 0, errors };
  },

  /**
   * Validate user name
   */
  validateName(name: string | undefined): ValidationResult {
    const errors: string[] = [];

    if (!name) {
      errors.push('Name is required');
    } else if (typeof name !== 'string') {
      errors.push('Name must be a string');
    } else if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    } else if (name.length > 100) {
      errors.push('Name cannot exceed 100 characters');
    } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      errors.push('Name contains invalid characters');
    }

    return { isValid: errors.length === 0, errors };
  },

  /**
   * Validate numeric amount (for donations, etc.)
   */
  validateAmount(amount: number | string | undefined, min = 0, max = 1000000): ValidationResult {
    const errors: string[] = [];
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (amount === undefined || amount === null || amount === '') {
      errors.push('Amount is required');
    } else if (!Number.isFinite(numAmount)) {
      errors.push('Amount must be a valid number');
    } else if (numAmount < min) {
      errors.push(`Amount must be at least ${min}`);
    } else if (numAmount > max) {
      errors.push(`Amount cannot exceed ${max}`);
    }

    return { isValid: errors.length === 0, errors };
  },

  /**
   * Validate trust score (0-100)
   */
  validateTrustScore(score: number | undefined): ValidationResult {
    const errors: string[] = [];

    if (score === undefined || score === null) {
      errors.push('Trust score is required');
    } else if (!Number.isFinite(score)) {
      errors.push('Trust score must be a valid number');
    } else if (score < 0 || score > 100) {
      errors.push('Trust score must be between 0 and 100');
    }

    return { isValid: errors.length === 0, errors };
  },

  /**
   * Validate wallet address
   */
  validateWalletAddress(address: string | undefined): ValidationResult {
    const errors: string[] = [];
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

    if (!address) {
      errors.push('Wallet address is required');
    } else if (typeof address !== 'string') {
      errors.push('Wallet address must be a string');
    } else if (!ethereumAddressRegex.test(address)) {
      errors.push('Wallet address must be a valid Ethereum address (0x followed by 40 hex characters)');
    }

    return { isValid: errors.length === 0, errors };
  },

  /**
   * Sanitize string input (remove potentially harmful content)
   */
  sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .slice(0, 10000); // Limit length
  },

  /**
   * Validate array of IDs
   */
  validateIdArray(ids: any[] | undefined): ValidationResult {
    const errors: string[] = [];

    if (!ids) {
      errors.push('ID array is required');
    } else if (!Array.isArray(ids)) {
      errors.push('Must be an array');
    } else if (ids.length === 0) {
      errors.push('Array cannot be empty');
    } else if (ids.length > 1000) {
      errors.push('Array cannot contain more than 1000 items');
    } else if (!ids.every(id => typeof id === 'string' && id.length > 0)) {
      errors.push('All items must be non-empty strings');
    }

    return { isValid: errors.length === 0, errors };
  },

  /**
   * Validate date timestamp
   */
  validateTimestamp(timestamp: number | undefined): ValidationResult {
    const errors: string[] = [];
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    if (timestamp === undefined || timestamp === null) {
      errors.push('Timestamp is required');
    } else if (!Number.isInteger(timestamp)) {
      errors.push('Timestamp must be an integer');
    } else if (timestamp < 0) {
      errors.push('Timestamp cannot be negative');
    } else if (timestamp > now + maxAge) {
      errors.push('Timestamp cannot be in the far future');
    } else if (now - timestamp > maxAge * 100) {
      errors.push('Timestamp is too old');
    }

    return { isValid: errors.length === 0, errors };
  }
};
