class Contact {
  constructor(data = {}) {
    this.name = data.name || '';
    this.birthday = data.birthday || '';
    this.tier = data.tier || 'acquaintance';
    this.religion = data.religion || 'none';
    this.nationality = data.nationality || 'none';
    this.description = data.description || '';
    this.customDates = data.customDates || [];
    this.telegramUserId = data.telegramUserId || null;
    this.dateAdded = data.dateAdded || new Date().toISOString().split('T')[0];
  }

  // Validation methods
  isValid() {
    return this.name && this.birthday && this.isValidBirthday();
  }

  isValidBirthday() {
    if (!this.birthday) return false;
    
    const date = new Date(this.birthday);
    const now = new Date();
    const minYear = 1900;
    const maxYear = now.getFullYear();
    
    return date instanceof Date && 
           !isNaN(date) && 
           date.getFullYear() >= minYear && 
           date.getFullYear() <= maxYear;
  }

  // Get age
  getAge() {
    if (!this.birthday) return null;
    
    const today = new Date();
    const birthDate = new Date(this.birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Get next birthday
  getNextBirthday() {
    if (!this.birthday) return null;
    
    const today = new Date();
    const birthDate = new Date(this.birthday);
    const currentYear = today.getFullYear();
    
    let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    
    if (nextBirthday < today) {
      nextBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
    }
    
    return nextBirthday;
  }

  // Get days until next birthday
  getDaysUntilBirthday() {
    const nextBirthday = this.getNextBirthday();
    if (!nextBirthday) return null;
    
    const today = new Date();
    const timeDiff = nextBirthday.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // Add custom date
  addCustomDate(name, date, recurring = true) {
    this.customDates.push({
      name,
      date,
      recurring
    });
  }

  // Remove custom date
  removeCustomDate(name) {
    this.customDates = this.customDates.filter(cd => cd.name !== name);
  }

  // Get upcoming custom dates
  getUpcomingCustomDates(days = 30) {
    const today = new Date();
    const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return this.customDates.filter(cd => {
      const eventDate = new Date(cd.date);
      const currentYear = today.getFullYear();
      
      // Check this year's date
      let thisYearDate = new Date(currentYear, eventDate.getMonth(), eventDate.getDate());
      
      // If it's already passed this year and recurring, check next year
      if (thisYearDate < today && cd.recurring) {
        thisYearDate = new Date(currentYear + 1, eventDate.getMonth(), eventDate.getDate());
      }
      
      return thisYearDate >= today && thisYearDate <= futureDate;
    });
  }

  // Convert to Google Sheets row format
  toSheetRow() {
    return [
      this.name,
      this.birthday,
      this.tier,
      this.religion,
      this.nationality,
      this.description,
      JSON.stringify(this.customDates),
      this.telegramUserId,
      this.dateAdded
    ];
  }

  // Create from Google Sheets row
  static fromSheetRow(row) {
    return new Contact({
      name: row[0] || '',
      birthday: row[1] || '',
      tier: row[2] || 'acquaintance',
      religion: row[3] || 'none',
      nationality: row[4] || 'none',
      description: row[5] || '',
      customDates: row[6] ? JSON.parse(row[6]) : [],
      telegramUserId: row[7] || null,
      dateAdded: row[8] || new Date().toISOString().split('T')[0]
    });
  }

  // Get display name for tier
  getTierDisplayName() {
    const tierNames = {
      'gold': 'Gold Tier',
      'family': 'Family',
      'friend': 'Friend',
      'acquaintance': 'Acquaintance'
    };
    return tierNames[this.tier] || this.tier;
  }

  // Get display name for religion
  getReligionDisplayName() {
    const religionNames = {
      'christian': 'Christian',
      'muslim': 'Muslim',
      'jewish': 'Jewish',
      'hindu': 'Hindu',
      'buddhist': 'Buddhist',
      'none': 'None',
      'other': 'Other'
    };
    return religionNames[this.religion] || this.religion;
  }

  // Get display name for nationality
  getNationalityDisplayName() {
    const nationalityNames = {
      'american': 'American',
      'peruvian': 'Peruvian',
      'dominican': 'Dominican',
      'none': 'None',
      'other': 'Other'
    };
    return nationalityNames[this.nationality] || this.nationality;
  }

  // Get reminder priority (lower number = higher priority)
  getReminderPriority() {
    const priorities = {
      'gold': 1,
      'family': 2,
      'friend': 3,
      'acquaintance': 4
    };
    return priorities[this.tier] || 5;
  }

  // Check if contact should get early birthday reminder
  shouldGetEarlyBirthdayReminder() {
    const daysUntil = this.getDaysUntilBirthday();
    if (daysUntil === null) return false;
    
    if (this.tier === 'gold' && (daysUntil === 3 || daysUntil === 1)) return true;
    if (this.tier === 'family' && daysUntil === 1) return true;
    
    return false;
  }

  // Check if contact should get birthday reminder today
  shouldGetBirthdayReminderToday() {
    const daysUntil = this.getDaysUntilBirthday();
    return daysUntil === 0;
  }
}

module.exports = Contact;
