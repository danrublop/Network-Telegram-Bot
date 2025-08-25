const moment = require('moment-timezone');

class DateParser {
  constructor() {
    this.timezone = process.env.USER_TIMEZONE || 'America/New_York';
  }

  // Parse date from various formats
  parseDate(dateString) {
    if (!dateString) return null;

    // Try common formats
    const formats = [
      'MM/DD/YYYY',
      'MM-DD-YYYY',
      'YYYY-MM-DD',
      'MM/DD/YY',
      'MM-DD-YY',
      'MMM DD, YYYY',
      'MMMM DD, YYYY',
      'DD/MM/YYYY',
      'DD-MM-YYYY'
    ];

    for (const format of formats) {
      const parsed = moment(dateString, format, true);
      if (parsed.isValid()) {
        return parsed.toDate();
      }
    }

    // Try natural language parsing
    const naturalParsed = this.parseNaturalLanguage(dateString);
    if (naturalParsed) {
      return naturalParsed;
    }

    return null;
  }

  // Parse natural language dates
  parseNaturalLanguage(dateString) {
    const lowerDate = dateString.toLowerCase().trim();
    
    // Handle "today", "tomorrow", "yesterday"
    if (lowerDate === 'today') {
      return moment().tz(this.timezone).startOf('day').toDate();
    }
    if (lowerDate === 'tomorrow') {
      return moment().tz(this.timezone).add(1, 'day').startOf('day').toDate();
    }
    if (lowerDate === 'yesterday') {
      return moment().tz(this.timezone).subtract(1, 'day').startOf('day').toDate();
    }

    // Handle month names with day and year
    // Examples: "March 16 2007", "Mar 16 2007", "16 March 2007", "16 Mar 2007"
    const monthPatterns = [
      // "March 16 2007" or "Mar 16 2007"
      /^(january|jan|february|feb|march|mar|april|apr|may|june|jul|july|august|aug|september|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})\s+(\d{4})$/i,
      // "16 March 2007" or "16 Mar 2007"
      /^(\d{1,2})\s+(january|jan|february|feb|march|mar|april|apr|may|june|jul|july|august|aug|september|sept|october|oct|november|nov|december|dec)\s+(\d{4})$/i,
      // "March 16, 2007" or "Mar 16, 2007" (with comma)
      /^(january|jan|february|feb|march|mar|april|apr|may|june|jul|july|august|aug|september|sept|october|oct|november|nov|december|dec)\s+(\d{1,2}),?\s+(\d{4})$/i,
      // "16 March, 2007" or "16 Mar, 2007" (with comma)
      /^(\d{1,2})\s+(january|jan|february|feb|march|mar|april|apr|may|june|jul|july|august|aug|september|sept|october|oct|november|nov|december|dec),?\s+(\d{4})$/i
    ];

    for (const pattern of monthPatterns) {
      const match = dateString.match(pattern);
      if (match) {
        let month, day, year;
        
        if (isNaN(match[1])) {
          // First group is month name
          month = this.getMonthNumber(match[1]);
          day = parseInt(match[2]);
          year = parseInt(match[3]);
        } else {
          // First group is day
          day = parseInt(match[1]);
          month = this.getMonthNumber(match[2]);
          year = parseInt(match[3]);
        }
        
        if (month !== null && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
          return moment(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`).toDate();
        }
      }
    }

    // Handle "next week", "next month", etc.
    if (lowerDate.includes('next')) {
      if (lowerDate.includes('week')) {
        return moment().tz(this.timezone).add(1, 'week').startOf('week').toDate();
      }
      if (lowerDate.includes('month')) {
        return moment().tz(this.timezone).add(1, 'month').startOf('month').toDate();
      }
      if (lowerDate.includes('year')) {
        return moment().tz(this.timezone).add(1, 'year').startOf('year').toDate();
      }
    }

    // Handle "last week", "last month", etc.
    if (lowerDate.includes('last')) {
      if (lowerDate.includes('week')) {
        return moment().tz(this.timezone).subtract(1, 'week').startOf('week').toDate();
      }
      if (lowerDate.includes('month')) {
        return moment().tz(this.timezone).subtract(1, 'month').startOf('month').toDate();
      }
      if (lowerDate.includes('year')) {
        return moment().tz(this.timezone).subtract(1, 'year').startOf('year').toDate();
      }
    }

    // Handle "in X days/weeks/months"
    const inMatch = lowerDate.match(/in (\d+) (day|days|week|weeks|month|months|year|years)/);
    if (inMatch) {
      const amount = parseInt(inMatch[1]);
      const unit = inMatch[2].replace(/s$/, ''); // Remove plural
      return moment().tz(this.timezone).add(amount, unit).startOf('day').toDate();
    }

    // Handle "X days/weeks/months ago"
    const agoMatch = lowerDate.match(/(\d+) (day|days|week|weeks|month|months|year|years) ago/);
    if (agoMatch) {
      const amount = parseInt(agoMatch[1]);
      const unit = agoMatch[2].replace(/s$/, ''); // Remove plural
      return moment().tz(this.timezone).subtract(amount, unit).startOf('day').toDate();
    }

    return null;
  }

  // Convert month name to month number
  getMonthNumber(monthName) {
    const months = {
      'january': 1, 'jan': 1,
      'february': 2, 'feb': 2,
      'march': 3, 'mar': 3,
      'april': 4, 'apr': 4,
      'may': 5,
      'june': 6, 'jun': 6,
      'july': 7, 'jul': 7,
      'august': 8, 'aug': 8,
      'september': 9, 'sept': 9, 'sep': 9,
      'october': 10, 'oct': 10,
      'november': 11, 'nov': 11,
      'december': 12, 'dec': 12
    };
    
    return months[monthName.toLowerCase()] || null;
  }

  // Format date for display
  formatDate(date, format = 'MMM DD, YYYY') {
    if (!date) return 'Invalid date';
    
    try {
      return moment(date).tz(this.timezone).format(format);
    } catch (error) {
      return 'Invalid date';
    }
  }

  // Format date for Google Sheets (YYYY-MM-DD)
  formatDateForSheets(date) {
    if (!date) return '';
    
    try {
      return moment(date).format('YYYY-MM-DD');
    } catch (error) {
      return '';
    }
  }

  // Get relative time (e.g., "2 days ago", "in 3 days")
  getRelativeTime(date) {
    if (!date) return 'Invalid date';
    
    try {
      return moment(date).tz(this.timezone).fromNow();
    } catch (error) {
      return 'Invalid date';
    }
  }

  // Get days until date
  getDaysUntil(date) {
    if (!date) return null;
    
    try {
      const now = moment().tz(this.timezone).startOf('day');
      const targetDate = moment(date).tz(this.timezone).startOf('day');
      return targetDate.diff(now, 'days');
    } catch (error) {
      return null;
    }
  }

  // Get days since date
  getDaysSince(date) {
    if (!date) return null;
    
    try {
      const now = moment().tz(this.timezone).startOf('day');
      const targetDate = moment(date).tz(this.timezone).startOf('day');
      return now.diff(targetDate, 'days');
    } catch (error) {
      return null;
    }
  }

  // Check if date is today
  isToday(date) {
    if (!date) return false;
    
    try {
      const today = moment().tz(this.timezone).startOf('day');
      const targetDate = moment(date).tz(this.timezone).startOf('day');
      return today.isSame(targetDate);
    } catch (error) {
      return false;
    }
  }

  // Check if date is tomorrow
  isTomorrow(date) {
    if (!date) return false;
    
    try {
      const tomorrow = moment().tz(this.timezone).add(1, 'day').startOf('day');
      const targetDate = moment(date).tz(this.timezone).startOf('day');
      return tomorrow.isSame(targetDate);
    } catch (error) {
      return false;
    }
  }

  // Check if date is in the past
  isPast(date) {
    if (!date) return false;
    
    try {
      const now = moment().tz(this.timezone);
      const targetDate = moment(date).tz(this.timezone);
      return targetDate.isBefore(now);
    } catch (error) {
      return false;
    }
  }

  // Check if date is in the future
  isFuture(date) {
    if (!date) return false;
    
    try {
      const now = moment().tz(this.timezone);
      const targetDate = moment(date).tz(this.timezone);
      return targetDate.isAfter(now);
    } catch (error) {
      return false;
    }
  }

  // Get age from birth date
  getAge(birthDate) {
    if (!birthDate) return null;
    
    try {
      const now = moment().tz(this.timezone);
      const birth = moment(birthDate).tz(this.timezone);
      return now.diff(birth, 'years');
    } catch (error) {
      return null;
    }
  }

  // Get next occurrence of a date (for recurring events)
  getNextOccurrence(date, year = null) {
    if (!date) return null;
    
    try {
      const targetYear = year || moment().tz(this.timezone).year();
      const originalDate = moment(date);
      const nextDate = moment().tz(this.timezone).year(targetYear)
        .month(originalDate.month())
        .date(originalDate.date());
      
      // If the date has already passed this year, get next year
      if (nextDate.isBefore(moment().tz(this.timezone))) {
        return nextDate.add(1, 'year').toDate();
      }
      
      return nextDate.toDate();
    } catch (error) {
      return null;
    }
  }

  // Validate date string
  isValidDate(dateString) {
    if (!dateString) return false;
    
    const parsed = this.parseDate(dateString);
    return parsed !== null;
  }

  // Get current date in user timezone
  getCurrentDate() {
    return moment().tz(this.timezone).toDate();
  }

  // Get start of day for a date
  getStartOfDay(date) {
    if (!date) return null;
    
    try {
      return moment(date).tz(this.timezone).startOf('day').toDate();
    } catch (error) {
      return null;
    }
  }

  // Get end of day for a date
  getEndOfDay(date) {
    if (!date) return null;
    
    try {
      return moment(date).tz(this.timezone).endOf('day').toDate();
    } catch (error) {
      return null;
    }
  }

  // Get week number for a date
  getWeekNumber(date) {
    if (!date) return null;
    
    try {
      return moment(date).tz(this.timezone).week();
    } catch (error) {
      return null;
    }
  }

  // Get month name for a date
  getMonthName(date) {
    if (!date) return '';
    
    try {
      return moment(date).tz(this.timezone).format('MMMM');
    } catch (error) {
      return '';
    }
  }

  // Get day name for a date
  getDayName(date) {
    if (!date) return '';
    
    try {
      return moment(date).tz(this.timezone).format('dddd');
    } catch (error) {
      return '';
    }
  }

  // Check if date is a weekend
  isWeekend(date) {
    if (!date) return false;
    
    try {
      const day = moment(date).tz(this.timezone).day();
      return day === 0 || day === 6; // Sunday = 0, Saturday = 6
    } catch (error) {
      return false;
    }
  }

  // Check if date is a weekday
  isWeekday(date) {
    return !this.isWeekend(date);
  }
}

module.exports = DateParser;
