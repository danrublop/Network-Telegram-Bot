/**
 * Telegram Contact Management Bot - Google Apps Script
 * 
 * This script provides a web app interface for the Telegram bot to interact with Google Sheets.
 * Deploy this as a web app to get a URL that your bot can call.
 */

// Global variables
const SPREADSHEET_ID = ''; // Leave empty to use the active spreadsheet
const SHEET_NAME = 'Contacts'; // Name of the sheet to use

/**
 * Main doPost function - handles all incoming requests from the bot
 */
function doPost(e) {
  try {
    // Parse the incoming request
    const data = JSON.parse(e.postData.contents);
    const functionName = e.parameter.function;
    const spreadsheetId = data.spreadsheetId || SPREADSHEET_ID;
    
    // Get the spreadsheet
    const spreadsheet = getSpreadsheet(spreadsheetId);
    if (!spreadsheet) {
      return createResponse(false, 'Spreadsheet not found');
    }
    
    // Route to appropriate function
    let result;
    switch (functionName) {
      case 'testConnection':
        result = testConnection(spreadsheet);
        break;
      case 'getAllContacts':
        result = getAllContacts(spreadsheet);
        break;
      case 'addContact':
        result = addContact(spreadsheet, data.contact);
        break;
      case 'updateContact':
        result = updateContact(spreadsheet, data.rowIndex, data.contact);
        break;
      case 'deleteContact':
        result = deleteContact(spreadsheet, data.rowIndex);
        break;
      case 'findContactRowIndex':
        result = findContactRowIndex(spreadsheet, data.name);
        break;
      case 'searchContacts':
        result = searchContacts(spreadsheet, data.searchTerm);
        break;
      case 'getContactsByReligion':
        result = getContactsByReligion(spreadsheet, data.religion);
        break;
      case 'getContactsByNationality':
        result = getContactsByNationality(spreadsheet, data.nationality);
        break;
      case 'getContactsByTier':
        result = getContactsByTier(spreadsheet, data.tier);
        break;
      case 'getContactsWithUpcomingBirthdays':
        result = getContactsWithUpcomingBirthdays(spreadsheet, data.days);
        break;
      case 'getContactsWithUpcomingCustomDates':
        result = getContactsWithUpcomingCustomDates(spreadsheet, data.days);
        break;
      case 'exportToCSV':
        result = exportToCSV(spreadsheet);
        break;
      case 'createBackup':
        result = createBackup(spreadsheet);
        break;
      case 'initializeSpreadsheet':
        result = initializeSpreadsheet(spreadsheet);
        break;
      default:
        result = createResponse(false, `Unknown function: ${functionName}`);
    }
    
    // Return the result
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify(createResponse(false, error.message)))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get the spreadsheet by ID or active spreadsheet
 */
function getSpreadsheet(spreadsheetId) {
  try {
    if (spreadsheetId) {
      return SpreadsheetApp.openById(spreadsheetId);
    } else {
      return SpreadsheetApp.getActiveSpreadsheet();
    }
  } catch (error) {
    console.error('Error getting spreadsheet:', error);
    return null;
  }
}

/**
 * Get the contacts sheet, create if it doesn't exist
 */
function getContactsSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    initializeHeaders(sheet);
  }
  return sheet;
}

/**
 * Initialize headers for the contacts sheet
 */
function initializeHeaders(sheet) {
  const headers = [
    'Name',
    'Birthday', 
    'Tier',
    'Religion',
    'Nationality',
    'Description',
    'Custom Dates',
    'Telegram User ID',
    'Date Added'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/**
 * Test connection to the spreadsheet
 */
function testConnection(spreadsheet) {
  try {
    const sheet = getContactsSheet(spreadsheet);
    return createResponse(true, {
      spreadsheetTitle: spreadsheet.getName(),
      sheets: [sheet.getName()],
      totalRows: sheet.getLastRow()
    });
  } catch (error) {
    return createResponse(false, error.message);
  }
}

/**
 * Get all contacts from the sheet
 */
function getAllContacts(spreadsheet) {
  try {
    const sheet = getContactsSheet(spreadsheet);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return createResponse(true, { contacts: [] });
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    const contacts = data.filter(row => row[0] && row[0].trim() !== ''); // Filter out empty rows
    
    return createResponse(true, { contacts: contacts });
  } catch (error) {
    return createResponse(false, error.message);
  }
}

/**
 * Add a new contact to the sheet
 */
function addContact(spreadsheet, contactData) {
  try {
    const sheet = getContactsSheet(spreadsheet);
    const nextRow = sheet.getLastRow() + 1;
    
    // Add the contact data
    sheet.getRange(nextRow, 1, 1, contactData.length).setValues([contactData]);
    
    return createResponse(true, { rowIndex: nextRow - 1 });
  } catch (error) {
    return createResponse(false, error.message);
  }
}

/**
 * Update an existing contact
 */
function updateContact(spreadsheet, rowIndex, contactData) {
  try {
    const sheet = getContactsSheet(spreadsheet);
    const actualRow = rowIndex + 1; // Convert to 1-based index
    
    // Update the contact data
    sheet.getRange(actualRow, 1, 1, contactData.length).setValues([contactData]);
    
    return createResponse(true, { message: 'Contact updated successfully' });
  } catch (error) {
    return createResponse(false, error.message);
  }
}

/**
 * Delete a contact from the sheet
 */
function deleteContact(spreadsheet, rowIndex) {
  try {
    const sheet = getContactsSheet(spreadsheet);
    const actualRow = rowIndex + 1; // Convert to 1-based index
    
    // Delete the row
    sheet.deleteRow(actualRow);
    
    return createResponse(true, { message: 'Contact deleted successfully' });
  } catch (error) {
    return createResponse(false, error.message);
  }
}

/**
 * Find contact by name and return row index
 */
function findContactRowIndex(spreadsheet, name) {
  try {
    const sheet = getContactsSheet(spreadsheet);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return createResponse(false, { rowIndex: -1 });
    }
    
    const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    
    for (let i = 0; i < names.length; i++) {
      if (names[i][0] && names[i][0].toLowerCase() === name.toLowerCase()) {
        return createResponse(true, { rowIndex: i });
      }
    }
    
    return createResponse(false, { rowIndex: -1 });
  } catch (error) {
    return createResponse(false, error.message);
  }
}

/**
 * Search contacts by name (partial match)
 */
function searchContacts(spreadsheet, searchTerm) {
  try {
    const sheet = getContactsSheet(spreadsheet);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return createResponse(true, { contacts: [] });
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    const searchLower = searchTerm.toLowerCase();
    
    const matchingContacts = data.filter(row => 
      row[0] && row[0].toLowerCase().includes(searchLower)
    );
    
    return createResponse(true, { contacts: matchingContacts });
  } catch (error) {
    return createResponse(false, error.message);
  }
}

/**
 * Get contacts by religion
 */
function getContactsByReligion(spreadsheet, religion) {
  try {
    const sheet = getContactsSheet(spreadsheet);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return createResponse(true, { contacts: [] });
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    const filteredContacts = data.filter(row => 
      row[0] && row[3] && row[3].toLowerCase() === religion.toLowerCase()
    );
    
    return createResponse(true, { contacts: filteredContacts });
  } catch (error) {
    return createResponse(false, error.message);
  }
}

/**
 * Get contacts by nationality
 */
function getContactsByNationality(spreadsheet, nationality) {
  try {
    const sheet = getContactsSheet(spreadsheet);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return createResponse(true, { contacts: [] });
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    const filteredContacts = data.filter(row => 
      row[0] && row[4] && row[4].toLowerCase() === nationality.toLowerCase()
    );
    
    return createResponse(true, { contacts: filteredContacts });
  } catch (error) {
    return createResponse(false, error.message);
  }
}

/**
 * Get contacts by tier
 */
function getContactsByTier(spreadsheet, tier) {
  try {
    const sheet = getContactsSheet(spreadsheet);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return createResponse(true, { contacts: [] });
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    const filteredContacts = data.filter(row => 
      row[0] && row[2] && row[2].toLowerCase() === tier.toLowerCase()
    );
    
    return createResponse(true, { contacts: filteredContacts });
  } catch (error) {
    return createResponse(false, error.message);
  }
}

/**
 * Get contacts with upcoming birthdays
 */
function getContactsWithUpcomingBirthdays(spreadsheet, days) {
  try {
    const sheet = getContactsSheet(spreadsheet);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return createResponse(true, { contacts: [] });
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    const today = new Date();
    const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    
    const upcomingBirthdays = data.filter(row => {
      if (!row[0] || !row[1]) return false;
      
      try {
        const birthday = new Date(row[1]);
        const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        return nextBirthday <= futureDate;
      } catch (error) {
        return false;
      }
    });
    
    return createResponse(true, { contacts: upcomingBirthdays });
  } catch (error) {
    return createResponse(false, error.message);
  }
}

/**
 * Get contacts with upcoming custom dates
 */
function getContactsWithUpcomingCustomDates(spreadsheet, days) {
  try {
    const sheet = getContactsSheet(spreadsheet);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return createResponse(true, { contacts: [] });
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    const today = new Date();
    const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    
    const upcomingCustomDates = data.filter(row => {
      if (!row[0] || !row[6]) return false;
      
      try {
        const customDates = JSON.parse(row[6]);
        if (!Array.isArray(customDates)) return false;
        
        return customDates.some(customDate => {
          try {
            const eventDate = new Date(customDate.date);
            const nextEventDate = new Date(today.getFullYear(), eventDate.getMonth(), eventDate.getDate());
            
            if (nextEventDate < today && customDate.recurring) {
              nextEventDate.setFullYear(today.getFullYear() + 1);
            }
            
            return nextEventDate <= futureDate;
          } catch (error) {
            return false;
          }
        });
      } catch (error) {
        return false;
      }
    });
    
    return createResponse(true, { contacts: upcomingCustomDates });
  } catch (error) {
    return createResponse(false, error.message);
  }
}

/**
 * Export contacts to CSV format
 */
function exportToCSV(spreadsheet) {
  try {
    const sheet = getContactsSheet(spreadsheet);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return createResponse(true, { csvData: 'Name,Birthday,Tier,Religion,Nationality,Description,Custom Dates,Telegram User ID,Date Added\n' });
    }
    
    const data = sheet.getRange(1, 1, lastRow, 9).getValues();
    
    const csvRows = data.map(row => {
      return row.map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field || '';
      }).join(',');
    }).join('\n');
    
    return createResponse(true, { csvData: csvRows });
  } catch (error) {
    return createResponse(false, error.message);
  }
}

/**
 * Create backup of all data
 */
function createBackup(spreadsheet) {
  try {
    const sheet = getContactsSheet(spreadsheet);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return createResponse(true, { 
        backup: {
          timestamp: new Date().toISOString(),
          totalContacts: 0,
          contacts: []
        }
      });
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    const contacts = data.filter(row => row[0] && row[0].trim() !== '');
    
    const backup = {
      timestamp: new Date().toISOString(),
      totalContacts: contacts.length,
      contacts: contacts.map(row => ({
        name: row[0] || '',
        birthday: row[1] || '',
        tier: row[2] || '',
        religion: row[3] || '',
        nationality: row[4] || '',
        description: row[5] || '',
        customDates: row[6] || '[]',
        telegramUserId: row[7] || '',
        dateAdded: row[8] || ''
      }))
    };
    
    return createResponse(true, { backup: backup });
  } catch (error) {
    return createResponse(false, error.message);
  }
}

/**
 * Initialize spreadsheet with headers
 */
function initializeSpreadsheet(spreadsheet) {
  try {
    const sheet = getContactsSheet(spreadsheet);
    return createResponse(true, { message: 'Spreadsheet initialized successfully' });
  } catch (error) {
    return createResponse(false, error.message);
  }
}

/**
 * Helper function to create consistent response format
 */
function createResponse(success, data) {
  return {
    success: success,
    data: data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Test function - can be run manually in Apps Script editor
 */
function testFunctions() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  console.log('Testing connection:', testConnection(spreadsheet));
  console.log('Testing getAllContacts:', getAllContacts(spreadsheet));
}
