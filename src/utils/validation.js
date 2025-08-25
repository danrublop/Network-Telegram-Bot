class Validation {
  // Validate contact name
  static isValidName(name) {
    if (!name || typeof name !== 'string') return false;
    
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 100) return false;
    
    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const validNameRegex = /^[a-zA-Z\s\-'\.]+$/;
    return validNameRegex.test(trimmed);
  }

  // Validate birthday
  static isValidBirthday(birthday) {
    if (!birthday) return false;
    
    const date = new Date(birthday);
    if (isNaN(date.getTime())) return false;
    
    const now = new Date();
    const minYear = 1900;
    const maxYear = now.getFullYear();
    
    return date.getFullYear() >= minYear && date.getFullYear() <= maxYear;
  }

  // Validate tier
  static isValidTier(tier) {
    const validTiers = ['gold', 'family', 'friend', 'acquaintance'];
    return validTiers.includes(tier);
  }

  // Validate religion
  static isValidReligion(religion) {
    const validReligions = ['christian', 'muslim', 'jewish', 'hindu', 'buddhist', 'none', 'other'];
    return validReligions.includes(religion);
  }

  // Validate nationality
  static isValidNationality(nationality) {
    const validNationalities = ['american', 'peruvian', 'dominican', 'none', 'other'];
    return validNationalities.includes(nationality);
  }

  // Validate description
  static isValidDescription(description) {
    if (!description) return true; // Description is optional
    
    if (typeof description !== 'string') return false;
    
    const trimmed = description.trim();
    return trimmed.length <= 500; // Max 500 characters
  }

  // Validate custom date
  static isValidCustomDate(customDate) {
    if (!customDate || typeof customDate !== 'object') return false;
    
    if (!customDate.name || !customDate.date) return false;
    
    if (typeof customDate.name !== 'string' || customDate.name.trim().length === 0) return false;
    
    if (typeof customDate.date !== 'string') return false;
    
    const date = new Date(customDate.date);
    if (isNaN(date.getTime())) return false;
    
    if (typeof customDate.recurring !== 'boolean') return false;
    
    return true;
  }

  // Validate Telegram user ID
  static isValidTelegramUserId(userId) {
    if (!userId) return true; // Optional field
    
    return typeof userId === 'number' && userId > 0;
  }

  // Validate date added
  static isValidDateAdded(dateAdded) {
    if (!dateAdded) return true; // Will be set automatically
    
    const date = new Date(dateAdded);
    return !isNaN(date.getTime());
  }

  // Validate entire contact object
  static validateContact(contact) {
    const errors = [];
    
    if (!this.isValidName(contact.name)) {
      errors.push('Invalid name format');
    }
    
    if (!this.isValidBirthday(contact.birthday)) {
      errors.push('Invalid birthday format');
    }
    
    if (!this.isValidTier(contact.tier)) {
      errors.push('Invalid tier selection');
    }
    
    if (!this.isValidReligion(contact.religion)) {
      errors.push('Invalid religion selection');
    }
    
    if (!this.isValidNationality(contact.nationality)) {
      errors.push('Invalid nationality selection');
    }
    
    if (!this.isValidDescription(contact.description)) {
      errors.push('Description too long (max 500 characters)');
    }
    
    if (contact.customDates && Array.isArray(contact.customDates)) {
      contact.customDates.forEach((customDate, index) => {
        if (!this.isValidCustomDate(customDate)) {
          errors.push(`Invalid custom date at index ${index}`);
        }
      });
    }
    
    if (!this.isValidTelegramUserId(contact.telegramUserId)) {
      errors.push('Invalid Telegram user ID');
    }
    
    if (!this.isValidDateAdded(contact.dateAdded)) {
      errors.push('Invalid date added');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Sanitize contact data
  static sanitizeContact(contact) {
    const sanitized = { ...contact };
    
    // Sanitize name
    if (sanitized.name) {
      sanitized.name = sanitized.name.trim();
    }
    
    // Sanitize description
    if (sanitized.description) {
      sanitized.description = sanitized.description.trim();
    }
    
    // Sanitize custom dates
    if (sanitized.customDates && Array.isArray(sanitized.customDates)) {
      sanitized.customDates = sanitized.customDates.map(cd => ({
        name: cd.name.trim(),
        date: cd.date,
        recurring: Boolean(cd.recurring)
      }));
    }
    
    return sanitized;
  }

  // Validate search query
  static isValidSearchQuery(query) {
    if (!query || typeof query !== 'string') return false;
    
    const trimmed = query.trim();
    return trimmed.length >= 2 && trimmed.length <= 50;
  }

  // Validate date range
  static isValidDateRange(startDate, endDate) {
    if (!startDate || !endDate) return false;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    
    return start <= end;
  }

  // Validate reminder settings
  static isValidReminderSettings(settings) {
    if (!settings || typeof settings !== 'object') return false;
    
    if (settings.hour !== undefined) {
      if (typeof settings.hour !== 'number' || settings.hour < 0 || settings.hour > 23) {
        return false;
      }
    }
    
    if (settings.minute !== undefined) {
      if (typeof settings.minute !== 'number' || settings.minute < 0 || settings.minute > 59) {
        return false;
      }
    }
    
    if (settings.timezone !== undefined) {
      if (typeof settings.timezone !== 'string' || settings.timezone.trim().length === 0) {
        return false;
      }
    }
    
    return true;
  }

  // Validate CSV data
  static validateCSVData(csvData) {
    if (!csvData || typeof csvData !== 'string') return false;
    
    const lines = csvData.split('\n');
    if (lines.length < 2) return false; // Need at least header + 1 data row
    
    const header = lines[0].split(',');
    const requiredColumns = ['Name', 'Birthday', 'Tier', 'Religion', 'Nationality', 'Description', 'Custom Dates', 'Telegram User ID', 'Date Added'];
    
    // Check if all required columns are present
    for (const column of requiredColumns) {
      if (!header.includes(column)) {
        return false;
      }
    }
    
    return true;
  }

  // Validate phone number (for future use)
  static isValidPhoneNumber(phone) {
    if (!phone) return true; // Optional field
    
    // Basic phone number validation (can be enhanced)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  // Validate email (for future use)
  static isValidEmail(email) {
    if (!email) return true; // Optional field
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate URL (for future use)
  static isValidURL(url) {
    if (!url) return true; // Optional field
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Validate file size (for future use)
  static isValidFileSize(sizeInBytes, maxSizeInMB = 10) {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return sizeInBytes <= maxSizeInBytes;
  }

  // Validate file type (for future use)
  static isValidFileType(filename, allowedTypes = ['csv', 'json']) {
    if (!filename) return false;
    
    const extension = filename.split('.').pop().toLowerCase();
    return allowedTypes.includes(extension);
  }

  // Sanitize input string
  static sanitizeString(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Sanitize array of strings
  static sanitizeStringArray(array) {
    if (!Array.isArray(array)) return [];
    
    return array.map(item => this.sanitizeString(item)).filter(item => item.length > 0);
  }

  // Validate and sanitize search input
  static validateAndSanitizeSearch(input) {
    if (!this.isValidSearchQuery(input)) {
      return null;
    }
    
    return this.sanitizeString(input);
  }

  // Check if string contains only safe characters
  static containsOnlySafeCharacters(input) {
    if (typeof input !== 'string') return false;
    
    // Allow letters, numbers, spaces, and common punctuation
    const safeRegex = /^[a-zA-Z0-9\s\-'\.\,\!\?\(\)\:\;]+$/;
    return safeRegex.test(input);
  }

  // Validate time format (HH:MM)
  static isValidTimeFormat(time) {
    if (!time || typeof time !== 'string') return false;
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  // Validate timezone
  static isValidTimezone(timezone) {
    if (!timezone || typeof timezone !== 'string') return false;
    
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = Validation;
