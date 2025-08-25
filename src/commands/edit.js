const Contact = require('../models/contact');
const GoogleSheetsService = require('../services/googleSheets');
const Validation = require('../utils/validation');
const DateParser = require('../utils/dateParser');

class EditCommand {
  constructor() {
    this.googleSheets = new GoogleSheetsService();
    this.dateParser = new DateParser();
    this.userStates = new Map(); // Store user conversation states
  }

  // Handle /edit command
  async handle(msg, bot) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Extract contact name from command
    const contactName = text.replace('/edit', '').trim();
    
    if (!contactName) {
      await bot.sendMessage(chatId, 
        '✏️ *Edit Contact*\n\n' +
        'Usage: /edit [contact name]\n' +
        'Example: /edit John Smith',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    try {
      // Find the contact
      const rowIndex = await this.googleSheets.findContactRowIndex(contactName);
      
      if (rowIndex === -1) {
        await bot.sendMessage(chatId, `❌ Contact "${contactName}" not found. Use /search to find contacts.`);
        return;
      }

      // Get all contacts to find the exact one
      const contacts = await this.googleSheets.getAllContacts();
      const contact = contacts.find(c => c.name.toLowerCase() === contactName.toLowerCase());
      
      if (!contact) {
        await bot.sendMessage(chatId, `❌ Contact "${contactName}" not found.`);
        return;
      }

      // Initialize edit state
      this.userStates.set(chatId, {
        step: 'select_field',
        contact: contact,
        originalContact: { ...contact },
        rowIndex: rowIndex,
        field: null
      });

      await this.showEditOptions(chatId, bot, contact);

    } catch (error) {
      console.error('Error starting edit:', error);
      await bot.sendMessage(chatId, '❌ Error starting edit. Please try again.');
    }
  }

  // Show edit options
  async showEditOptions(chatId, bot, contact) {
    const message = `✏️ *Edit Contact: ${contact.name}*\n\n` +
                   `*Current Information:*\n` +
                   `• Name: ${contact.name}\n` +
                   `• Birthday: ${this.dateParser.formatDate(contact.birthday)}\n` +
                   `• Tier: ${contact.getTierDisplayName()}\n` +
                   `• Religion: ${contact.getReligionDisplayName()}\n` +
                   `• Nationality: ${contact.getNationalityDisplayName()}\n` +
                   `• Description: ${contact.description || 'None'}\n` +
                   `• Custom Dates: ${contact.customDates.length}\n\n` +
                   `*What would you like to edit?*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✏️ Name', callback_data: 'edit_name' },
          { text: '🎂 Birthday', callback_data: 'edit_birthday' }
        ],
        [
          { text: '👥 Tier', callback_data: 'edit_tier' },
          { text: '⛪ Religion', callback_data: 'edit_religion' }
        ],
        [
          { text: '🇺🇸 Nationality', callback_data: 'edit_nationality' },
          { text: '📝 Description', callback_data: 'edit_description' }
        ],
        [
          { text: '📅 Custom Dates', callback_data: 'edit_custom_dates' },
          { text: '❌ Cancel', callback_data: 'edit_cancel' }
        ]
      ]
    };

    await bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Handle text messages during edit
  async handleText(msg, bot) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    const userState = this.userStates.get(chatId);
    if (!userState) return false; // Not in edit mode
    
    try {
      switch (userState.step) {
        case 'edit_name':
          await this.handleEditName(chatId, text, bot, userState);
          break;
        case 'edit_birthday':
          await this.handleEditBirthday(chatId, text, bot, userState);
          break;
        case 'edit_description':
          await this.handleEditDescription(chatId, text, bot, userState);
          break;
        case 'custom_date_name':
          await this.handleCustomDateName(chatId, text, bot, userState);
          break;
        case 'custom_date_date':
          await this.handleCustomDateDate(chatId, text, bot, userState);
          break;
        case 'custom_date_recurring':
          await this.handleCustomDateRecurring(chatId, text, bot, userState);
          break;
        default:
          return false;
      }
      return true; // Message was handled
    } catch (error) {
      console.error('Error in edit command:', error);
      await bot.sendMessage(chatId, '❌ An error occurred. Please try again with /edit');
      this.userStates.delete(chatId);
      return true;
    }
  }

  // Handle edit name
  async handleEditName(chatId, text, bot, userState) {
    if (!Validation.isValidName(text)) {
      await bot.sendMessage(chatId, '❌ Please enter a valid name (2-100 characters, letters only)');
      return;
    }

    userState.contact.name = text.trim();
    userState.step = 'select_field';

    await bot.sendMessage(chatId, `✅ Name updated to: ${userState.contact.name}`);
    await this.showEditOptions(chatId, bot, userState.contact);
  }

  // Handle edit birthday
  async handleEditBirthday(chatId, text, bot, userState) {
    const birthday = this.dateParser.parseDate(text);
    
    if (!birthday || !Validation.isValidBirthday(birthday)) {
      await bot.sendMessage(chatId, '❌ Please enter a valid birthday in MM/DD/YYYY format');
      return;
    }

    userState.contact.birthday = this.dateParser.formatDateForSheets(birthday);
    userState.step = 'select_field';

    const age = this.dateParser.getAge(birthday);
    const ageText = age ? ` (${age} years old)` : '';
    
    await bot.sendMessage(chatId, `✅ Birthday updated to: ${this.dateParser.formatDate(birthday)}${ageText}`);
    await this.showEditOptions(chatId, bot, userState.contact);
  }

  // Handle edit description
  async handleEditDescription(chatId, text, bot, userState) {
    if (text.toLowerCase() === 'skip') {
      userState.contact.description = '';
    } else {
      if (!Validation.isValidDescription(text)) {
        await bot.sendMessage(chatId, '❌ Description too long (max 500 characters)');
        return;
      }
      userState.contact.description = text.trim();
    }

    userState.step = 'select_field';

    await bot.sendMessage(chatId, `✅ Description updated to: ${userState.contact.description || 'None'}`);
    await this.showEditOptions(chatId, bot, userState.contact);
  }

  // Handle custom date name
  async handleCustomDateName(chatId, text, bot, userState) {
    userState.tempCustomDate = { name: text.trim() };
    userState.step = 'custom_date_date';

    const message = `📅 *Custom Date:* ${userState.tempCustomDate.name}\n\n` +
                   `*When is this event?*\n` +
                   `Format: MM/DD/YYYY (e.g., 06/20/2023)`;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  // Handle custom date date
  async handleCustomDateDate(chatId, text, bot, userState) {
    const date = this.dateParser.parseDate(text);
    
    if (!date) {
      await bot.sendMessage(chatId, '❌ Please enter a valid date in MM/DD/YYYY format');
      return;
    }

    userState.tempCustomDate.date = this.dateParser.formatDateForSheets(date);
    userState.step = 'custom_date_recurring';

    const message = `📅 *Date:* ${this.dateParser.formatDate(date)}\n\n` +
                   `*Is this a recurring annual event?*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Yes (annual)', callback_data: 'recurring_yes' },
          { text: '❌ No (one-time)', callback_data: 'recurring_no' }
        ]
      ]
    };

    await bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Handle custom date recurring
  async handleCustomDateRecurring(chatId, text, bot, userState) {
    // This should be handled by callback query, but fallback to text
    const recurring = text.toLowerCase().includes('yes') || text.toLowerCase().includes('annual');
    
    userState.tempCustomDate.recurring = recurring;
    
    // Add custom date to contact
    userState.contact.addCustomDate(
      userState.tempCustomDate.name,
      userState.tempCustomDate.date,
      userState.tempCustomDate.recurring
    );

    const message = `✅ *Custom Date Added:*\n` +
                   `• ${userState.tempCustomDate.name}\n` +
                   `• Date: ${this.dateParser.formatDate(userState.tempCustomDate.date)}\n` +
                   `• Recurring: ${recurring ? 'Yes' : 'No'}\n\n` +
                   `*Any more custom dates to add?*\n` +
                   `Type "none" to finish, or describe another event:`;

    userState.step = 'custom_dates';
    delete userState.tempCustomDate;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  // Handle callback queries
  async handleCallbackQuery(callbackQuery, bot) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const userState = this.userStates.get(chatId);
    
    if (!userState) return false;

    try {
      if (data === 'edit_name') {
        userState.step = 'edit_name';
        await bot.sendMessage(chatId, '✏️ *Edit Name*\n\nEnter the new name:', { parse_mode: 'Markdown' });

      } else if (data === 'edit_birthday') {
        userState.step = 'edit_birthday';
        await bot.sendMessage(chatId, '🎂 *Edit Birthday*\n\nEnter the new birthday (MM/DD/YYYY):', { parse_mode: 'Markdown' });

      } else if (data === 'edit_tier') {
        await this.showTierOptions(chatId, bot, userState);

      } else if (data === 'edit_religion') {
        await this.showReligionOptions(chatId, bot, userState);

      } else if (data === 'edit_nationality') {
        await this.showNationalityOptions(chatId, bot, userState);

      } else if (data === 'edit_description') {
        userState.step = 'edit_description';
        await bot.sendMessage(chatId, '📝 *Edit Description*\n\nEnter the new description (or type "skip" to remove):', { parse_mode: 'Markdown' });

      } else if (data === 'edit_custom_dates') {
        await this.showCustomDatesOptions(chatId, bot, userState);

      } else if (data === 'edit_cancel') {
        await this.cancelEdit(chatId, bot, userState);

      } else if (data.startsWith('tier_')) {
        const tier = data.replace('tier_', '');
        userState.contact.tier = tier;
        await bot.sendMessage(chatId, `✅ Tier updated to: ${userState.contact.getTierDisplayName()}`);
        await this.showEditOptions(chatId, bot, userState.contact);

      } else if (data.startsWith('religion_')) {
        const religion = data.replace('religion_', '');
        userState.contact.religion = religion;
        await bot.sendMessage(chatId, `✅ Religion updated to: ${userState.contact.getReligionDisplayName()}`);
        await this.showEditOptions(chatId, bot, userState.contact);

      } else if (data.startsWith('nationality_')) {
        const nationality = data.replace('nationality_', '');
        userState.contact.nationality = nationality;
        await bot.sendMessage(chatId, `✅ Nationality updated to: ${userState.contact.getNationalityDisplayName()}`);
        await this.showEditOptions(chatId, bot, userState.contact);

      } else if (data.startsWith('recurring_')) {
        const recurring = data === 'recurring_yes';
        
        userState.tempCustomDate.recurring = recurring;
        
        // Add custom date to contact
        userState.contact.addCustomDate(
          userState.tempCustomDate.name,
          userState.tempCustomDate.date,
          userState.tempCustomDate.recurring
        );

        const message = `✅ *Custom Date Added:*\n` +
                       `• ${userState.tempCustomDate.name}\n` +
                       `• Date: ${this.dateParser.formatDate(userState.tempCustomDate.date)}\n` +
                       `• Recurring: ${recurring ? 'Yes' : 'No'}\n\n` +
                       `*Any more custom dates to add?*\n` +
                       `Type "none" to finish, or describe another event:`;

        userState.step = 'custom_dates';
        delete userState.tempCustomDate;

        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'Markdown'
        });
      }

      // Answer callback query
      await bot.answerCallbackQuery(callbackQuery.id);
      return true;

    } catch (error) {
      console.error('Error handling edit callback query:', error);
      return false;
    }
  }

  // Show tier options
  async showTierOptions(chatId, bot, userState) {
    const message = `👥 *Select New Tier*\n\n` +
                   `Current tier: ${userState.contact.getTierDisplayName()}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '👑 Gold Tier', callback_data: 'tier_gold' },
          { text: '👨‍👩‍👧‍👦 Family', callback_data: 'tier_family' }
        ],
        [
          { text: '👥 Friend', callback_data: 'tier_friend' },
          { text: '🤝 Acquaintance', callback_data: 'tier_acquaintance' }
        ]
      ]
    };

    await bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Show religion options
  async showReligionOptions(chatId, bot, userState) {
    const message = `⛪ *Select New Religion*\n\n` +
                   `Current religion: ${userState.contact.getReligionDisplayName()}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '⛪ Christian', callback_data: 'religion_christian' },
          { text: '☪️ Muslim', callback_data: 'religion_muslim' }
        ],
        [
          { text: '✡️ Jewish', callback_data: 'religion_jewish' },
          { text: '🕉️ Hindu', callback_data: 'religion_hindu' }
        ],
        [
          { text: '☸️ Buddhist', callback_data: 'religion_buddhist' },
          { text: '🚫 None', callback_data: 'religion_none' }
        ],
        [
          { text: '❓ Other', callback_data: 'religion_other' }
        ]
      ]
    };

    await bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Show nationality options
  async showNationalityOptions(chatId, bot, userState) {
    const message = `🇺🇸 *Select New Nationality*\n\n` +
                   `Current nationality: ${userState.contact.getNationalityDisplayName()}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🇺🇸 American', callback_data: 'nationality_american' },
          { text: '🇵🇪 Peruvian', callback_data: 'nationality_peruvian' }
        ],
        [
          { text: '🇩🇴 Dominican', callback_data: 'nationality_dominican' },
          { text: '❓ Other', callback_data: 'nationality_other' }
        ],
        [
          { text: '🚫 None', callback_data: 'nationality_none' }
        ]
      ]
    };

    await bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Show custom dates options
  async showCustomDatesOptions(chatId, bot, userState) {
    const contact = userState.contact;
    
    let message = `📅 *Custom Dates for ${contact.name}*\n\n`;
    
    if (contact.customDates.length === 0) {
      message += 'No custom dates set.\n\n';
    } else {
      contact.customDates.forEach((customDate, index) => {
        message += `${index + 1}. ${customDate.name}\n`;
        message += `   Date: ${this.dateParser.formatDate(customDate.date)}\n`;
        message += `   Recurring: ${customDate.recurring ? 'Yes' : 'No'}\n\n`;
      });
    }
    
    message += '*What would you like to do?*\n' +
               '• Type "add [event name]" to add a new custom date\n' +
               '• Type "remove [number]" to remove a custom date\n' +
               '• Type "none" to go back';

    userState.step = 'custom_dates';
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  // Cancel edit operation
  async cancelEdit(chatId, bot, userState) {
    this.userStates.delete(chatId);
    await bot.sendMessage(chatId, '❌ Edit operation cancelled.');
  }

  // Save changes
  async saveChanges(chatId, bot, userState) {
    try {
      // Validate contact
      const validation = Validation.validateContact(userState.contact);
      if (!validation.isValid) {
        await bot.sendMessage(chatId, `❌ Validation errors:\n${validation.errors.join('\n')}`);
        return;
      }

      // Update in Google Sheets
      await this.googleSheets.updateContact(userState.contact, userState.rowIndex);

      const message = `✅ *Contact Updated Successfully!* 🎉\n\n` +
                     `*Name:* ${userState.contact.name}\n` +
                     `*Birthday:* ${this.dateParser.formatDate(userState.contact.birthday)}\n` +
                     `*Tier:* ${userState.contact.getTierDisplayName()}\n` +
                     `*Religion:* ${userState.contact.getReligionDisplayName()}\n` +
                     `*Nationality:* ${userState.contact.getNationalityDisplayName()}\n` +
                     `*Description:* ${userState.contact.description || 'None'}\n` +
                     `*Custom Dates:* ${userState.contact.customDates.length}`;

      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

      // Clean up user state
      this.userStates.delete(chatId);

    } catch (error) {
      console.error('Error saving changes:', error);
      await bot.sendMessage(chatId, '❌ Error saving changes. Please try again.');
      this.userStates.delete(chatId);
    }
  }

  // Check if user is in edit mode
  isInEditMode(chatId) {
    return this.userStates.has(chatId);
  }
}

module.exports = EditCommand;
