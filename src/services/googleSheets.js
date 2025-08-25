const Contact = require('../models/contact');
require('dotenv').config();

class GoogleSheetsService {
  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    this.webAppUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    this.range = 'A:I';
    
    if (!this.webAppUrl) {
      console.warn('⚠️ GOOGLE_APPS_SCRIPT_URL not set. Using direct Google Sheets API as fallback.');
    }
  }

  // Get all contacts from Google Sheets via Apps Script
  async getAllContacts() {
    try {
      if (this.webAppUrl) {
        return await this.getContactsViaAppsScript('getAllContacts');
      } else {
        console.warn('⚠️ Falling back to direct Google Sheets API (requires service account setup)');
        return await this.getContactsViaDirectAPI();
      }
    } catch (error) {
      console.error('❌ Failed to get contacts:', error.message);
      throw error;
    }
  }

  // Add a new contact via Apps Script
  async addContact(contact) {
    try {
      if (this.webAppUrl) {
        const result = await this.callAppsScript('addContact', {
          contact: contact.toSheetRow()
        });
        
        if (result.success) {
          console.log(`✅ Contact "${contact.name}" added via Apps Script`);
          return true;
        } else {
          throw new Error(result.error || 'Unknown error from Apps Script');
        }
      } else {
        console.warn('⚠️ Falling back to direct Google Sheets API');
        return await this.addContactViaDirectAPI(contact);
      }
    } catch (error) {
      console.error('❌ Failed to add contact:', error.message);
      throw error;
    }
  }

  // Update an existing contact via Apps Script
  async updateContact(contact, rowIndex) {
    try {
      if (this.webAppUrl) {
        const result = await this.callAppsScript('updateContact', {
          rowIndex: rowIndex,
          contact: contact.toSheetRow()
        });
        
        if (result.success) {
          console.log(`✅ Contact "${contact.name}" updated via Apps Script`);
          return true;
        } else {
          throw new Error(result.error || 'Unknown error from Apps Script');
        }
      } else {
        console.warn('⚠️ Falling back to direct Google Sheets API');
        return await this.updateContactViaDirectAPI(contact, rowIndex);
      }
    } catch (error) {
      console.error('❌ Failed to update contact:', error.message);
      throw error;
    }
  }

  // Delete a contact via Apps Script
  async deleteContact(rowIndex) {
    try {
      if (this.webAppUrl) {
        const result = await this.callAppsScript('deleteContact', {
          rowIndex: rowIndex
        });
        
        if (result.success) {
          console.log(`✅ Contact deleted via Apps Script`);
          return true;
        } else {
          throw new Error(result.error || 'Unknown error from Apps Script');
        }
      } else {
        console.warn('⚠️ Falling back to direct Google Sheets API');
        return await this.deleteContactViaDirectAPI(rowIndex);
      }
    } catch (error) {
      console.error('❌ Failed to delete contact:', error.message);
      throw error;
    }
  }

  // Find contact by name and return row index
  async findContactRowIndex(name) {
    try {
      if (this.webAppUrl) {
        const result = await this.callAppsScript('findContactRowIndex', {
          name: name
        });
        
        if (result.success) {
          return result.rowIndex;
        } else {
          return -1; // Contact not found
        }
      } else {
        console.warn('⚠️ Falling back to direct Google Sheets API');
        return await this.findContactRowIndexViaDirectAPI(name);
      }
    } catch (error) {
      console.error('❌ Failed to find contact row index:', error.message);
      return -1;
    }
  }

  // Search contacts by name (partial match)
  async searchContacts(searchTerm) {
    try {
      if (this.webAppUrl) {
        const result = await this.callAppsScript('searchContacts', {
          searchTerm: searchTerm
        });
        
        if (result.success) {
          return result.contacts.map(row => Contact.fromSheetRow(row));
        } else {
          return [];
        }
      } else {
        console.warn('⚠️ Falling back to direct Google Sheets API');
        return await this.searchContactsViaDirectAPI(searchTerm);
      }
    } catch (error) {
      console.error('❌ Failed to search contacts:', error.message);
      return [];
    }
  }

  // Get contacts by religion
  async getContactsByReligion(religion) {
    try {
      if (this.webAppUrl) {
        const result = await this.callAppsScript('getContactsByReligion', {
          religion: religion
        });
        
        if (result.success) {
          return result.contacts.map(row => Contact.fromSheetRow(row));
        } else {
          return [];
        }
      } else {
        console.warn('⚠️ Falling back to direct Google Sheets API');
        return await this.getContactsByReligionViaDirectAPI(religion);
      }
    } catch (error) {
      console.error('❌ Failed to get contacts by religion:', error.message);
      return [];
    }
  }

  // Get contacts by nationality
  async getContactsByNationality(nationality) {
    try {
      if (this.webAppUrl) {
        const result = await this.callAppsScript('getContactsByNationality', {
          nationality: nationality
        });
        
        if (result.success) {
          return result.contacts.map(row => Contact.fromSheetRow(row));
        } else {
          return [];
        }
      } else {
        console.warn('⚠️ Falling back to direct Google Sheets API');
        return await this.getContactsByNationalityViaDirectAPI(nationality);
      }
    } catch (error) {
      console.error('❌ Failed to get contacts by nationality:', error.message);
      return [];
    }
  }

  // Get contacts by tier
  async getContactsByTier(tier) {
    try {
      if (this.webAppUrl) {
        const result = await this.callAppsScript('getContactsByTier', {
          tier: tier
        });
        
        if (result.success) {
          return result.contacts.map(row => Contact.fromSheetRow(row));
        } else {
          return [];
        }
      } else {
        console.warn('⚠️ Falling back to direct Google Sheets API');
        return await this.getContactsByTierViaDirectAPI(tier);
      }
    } catch (error) {
      console.error('❌ Failed to get contacts by tier:', error.message);
      return [];
    }
  }

  // Get contacts with upcoming birthdays
  async getContactsWithUpcomingBirthdays(days = 30) {
    try {
      if (this.webAppUrl) {
        const result = await this.callAppsScript('getContactsWithUpcomingBirthdays', {
          days: days
        });
        
        if (result.success) {
          return result.contacts.map(row => Contact.fromSheetRow(row));
        } else {
          return [];
        }
      } else {
        console.warn('⚠️ Falling back to direct Google Sheets API');
        return await this.getContactsWithUpcomingBirthdaysViaDirectAPI(days);
      }
    } catch (error) {
      console.error('❌ Failed to get contacts with upcoming birthdays:', error.message);
      return [];
    }
  }

  // Get contacts with upcoming custom dates
  async getContactsWithUpcomingCustomDates(days = 30) {
    try {
      if (this.webAppUrl) {
        const result = await this.callAppsScript('getContactsWithUpcomingCustomDates', {
          days: days
        });
        
        if (result.success) {
          return result.contacts.map(row => Contact.fromSheetRow(row));
        } else {
          return [];
        }
      } else {
        console.warn('⚠️ Falling back to direct Google Sheets API');
        return await this.getContactsWithUpcomingCustomDatesViaDirectAPI(days);
      }
    } catch (error) {
      console.error('❌ Failed to get contacts with upcoming custom dates:', error.message);
      return [];
    }
  }

  // Export contacts to CSV format
  async exportToCSV() {
    try {
      if (this.webAppUrl) {
        const result = await this.callAppsScript('exportToCSV');
        
        if (result.success) {
          return result.csvData;
        } else {
          throw new Error(result.error || 'Unknown error from Apps Script');
        }
      } else {
        console.warn('⚠️ Falling back to direct Google Sheets API');
        return await this.exportToCSVViaDirectAPI();
      }
    } catch (error) {
      console.error('❌ Failed to export contacts to CSV:', error.message);
      throw error;
    }
  }

  // Create backup of all data
  async createBackup() {
    try {
      if (this.webAppUrl) {
        const result = await this.callAppsScript('createBackup');
        
        if (result.success) {
          return result.backup;
        } else {
          throw new Error(result.error || 'Unknown error from Apps Script');
        }
      } else {
        console.warn('⚠️ Falling back to direct Google Sheets API');
        return await this.createBackupViaDirectAPI();
      }
    } catch (error) {
      console.error('❌ Failed to create backup:', error.message);
      throw error;
    }
  }

  // Call Google Apps Script web app
  async callAppsScript(functionName, parameters = {}) {
    try {
      const url = `${this.webAppUrl}?function=${functionName}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: this.spreadsheetId,
          ...parameters
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`❌ Apps Script call failed for ${functionName}:`, error.message);
      throw error;
    }
  }

  // Get contacts via Apps Script
  async getContactsViaAppsScript(functionName) {
    try {
      const result = await this.callAppsScript(functionName);
      
      if (result.success && result.data && result.data.contacts) {
        return result.data.contacts.map(row => Contact.fromSheetRow(row));
      } else {
        return [];
      }
    } catch (error) {
      console.error('❌ Apps Script call failed:', error.message);
      return [];
    }
  }

  // Fallback methods using direct Google Sheets API (for when Apps Script is not available)
  
  async getContactsViaDirectAPI() {
    // This would use the original Google Sheets API implementation
    // For now, return empty array as fallback
    console.warn('⚠️ Direct Google Sheets API not implemented as fallback');
    return [];
  }

  async addContactViaDirectAPI(contact) {
    console.warn('⚠️ Direct Google Sheets API not implemented as fallback');
    return false;
  }

  async updateContactViaDirectAPI(contact, rowIndex) {
    console.warn('⚠️ Direct Google Sheets API not implemented as fallback');
    return false;
  }

  async deleteContactViaDirectAPI(rowIndex) {
    console.warn('⚠️ Direct Google Sheets API not implemented as fallback');
    return false;
  }

  async findContactRowIndexViaDirectAPI(name) {
    console.warn('⚠️ Direct Google Sheets API not implemented as fallback');
    return -1;
  }

  async searchContactsViaDirectAPI(searchTerm) {
    console.warn('⚠️ Direct Google Sheets API not implemented as fallback');
    return [];
  }

  async getContactsByReligionViaDirectAPI(religion) {
    console.warn('⚠️ Direct Google Sheets API not implemented as fallback');
    return [];
  }

  async getContactsByNationalityViaDirectAPI(nationality) {
    console.warn('⚠️ Direct Google Sheets API not implemented as fallback');
    return [];
  }

  async getContactsByTierViaDirectAPI(tier) {
    console.warn('⚠️ Direct Google Sheets API not implemented as fallback');
    return [];
  }

  async getContactsWithUpcomingBirthdaysViaDirectAPI(days) {
    console.warn('⚠️ Direct Google Sheets API not implemented as fallback');
    return [];
  }

  async getContactsWithUpcomingCustomDatesViaDirectAPI(days) {
    console.warn('⚠️ Direct Google Sheets API not implemented as fallback');
    return [];
  }

  async exportToCSVViaDirectAPI() {
    console.warn('⚠️ Direct Google Sheets API not implemented as fallback');
    return '';
  }

  async createBackupViaDirectAPI() {
    console.warn('⚠️ Direct Google Sheets API not implemented as fallback');
    return {};
  }

  // Check if service is ready
  isReady() {
    return this.webAppUrl !== undefined || this.spreadsheetId !== undefined;
  }

  // Test connection
  async testConnection() {
    try {
      if (this.webAppUrl) {
        const result = await this.callAppsScript('testConnection');
        return {
          success: result.success,
          method: 'Google Apps Script',
          spreadsheetTitle: result.spreadsheetTitle || 'Unknown',
          sheets: result.sheets || []
        };
      } else {
        return {
          success: false,
          error: 'No Apps Script URL configured'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Initialize spreadsheet with headers if it's empty
  async initializeSpreadsheet() {
    try {
      if (this.webAppUrl) {
        const result = await this.callAppsScript('initializeSpreadsheet');
        
        if (result.success) {
          console.log('✅ Spreadsheet headers initialized via Apps Script');
        } else {
          console.warn('⚠️ Failed to initialize spreadsheet via Apps Script');
        }
      } else {
        console.warn('⚠️ Cannot initialize spreadsheet without Apps Script URL');
      }
    } catch (error) {
      console.error('❌ Failed to initialize spreadsheet:', error.message);
    }
  }
}

module.exports = GoogleSheetsService;
