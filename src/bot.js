const TelegramBot = require('node-telegram-bot-api');
const AddCommand = require('./commands/add');
const EditCommand = require('./commands/edit');
const GoogleSheetsService = require('./services/googleSheets');
const ReminderService = require('./services/reminders');
require('dotenv').config();

class ContactManagementBot {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    if (!this.token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required in environment variables');
    }

    this.bot = new TelegramBot(this.token, { polling: true });
    this.addCommand = new AddCommand();
    this.editCommand = new EditCommand();
    this.googleSheets = new GoogleSheetsService();
    this.reminderService = new ReminderService(this.bot);
    
    this.setupEventHandlers();
    this.setupCommands();
    
    console.log('🤖 Contact Management Bot initialized');
  }

  // Setup bot event handlers
  setupEventHandlers() {
    // Handle incoming messages
    this.bot.on('message', async (msg) => {
      try {
        await this.handleMessage(msg);
      } catch (error) {
        console.error('Error handling message:', error);
        await this.sendErrorMessage(msg.chat.id);
      }
    });

    // Handle callback queries (button clicks)
    this.bot.on('callback_query', async (callbackQuery) => {
      try {
        await this.handleCallbackQuery(callbackQuery);
      } catch (error) {
        console.error('Error handling callback query:', error);
        await this.bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred' });
      }
    });

    // Handle bot errors
    this.bot.on('error', (error) => {
      console.error('Bot error:', error);
    });

    // Handle polling errors
    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });
  }

  // Setup bot commands
  setupCommands() {
    // Set bot commands
    this.bot.setMyCommands([
      { command: '/start', description: 'Start the bot' },
      { command: '/add', description: 'Add a new contact' },
      { command: '/edit', description: 'Edit existing contact' },
      { command: '/delete', description: 'Delete a contact' },
      { command: '/clearall', description: 'Delete all contacts' },
      { command: '/list', description: 'List all contacts' },
      { command: '/search', description: 'Search for a contact' },
      { command: '/calendar', description: 'Show upcoming events' },
      { command: '/upcoming', description: 'Show next 30 days' },
      { command: '/today', description: 'Show today\'s reminders' },
      { command: '/export', description: 'Export contacts to CSV' },
      { command: '/help', description: 'Show help information' }
    ]);
  }

  // Handle incoming messages
  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from.id;

    // Log message for debugging
    console.log(`📨 Message from ${msg.from.first_name} (${userId}): ${text}`);

    // Check if user is in add mode
    if (this.addCommand.isInAddMode(chatId)) {
      const handled = await this.addCommand.handleText(msg, this.bot);
      if (handled) return;
    }

    // Check if user is in edit mode
    if (this.editCommand.isInEditMode(chatId)) {
      const handled = await this.editCommand.handleText(msg, this.bot);
      if (handled) return;
    }

    // Handle commands
    if (text && text.startsWith('/')) {
      await this.handleCommand(msg);
      return;
    }

    // Handle regular text messages
    await this.handleTextMessage(msg);
  }

  // Handle bot commands
  async handleCommand(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const command = text.split(' ')[0].toLowerCase();

    switch (command) {
      case '/start':
        await this.handleStart(msg);
        break;
      case '/add':
        await this.addCommand.handle(msg, this.bot);
        break;
      case '/edit':
        await this.editCommand.handle(msg, this.bot);
        break;
      case '/delete':
        await this.handleDelete(msg);
        break;
      case '/clearall':
        await this.handleClearAll(msg);
        break;
      case '/list':
        await this.handleList(msg);
        break;
      case '/search':
        await this.handleSearch(msg);
        break;
      case '/calendar':
        await this.handleCalendar(msg);
        break;
      case '/upcoming':
        await this.handleUpcoming(msg);
        break;
      case '/today':
        await this.handleToday(msg);
        break;
      case '/export':
        await this.handleExport(msg);
        break;
      case '/help':
        await this.handleHelp(msg);
        break;
      case '/cancel':
        await this.addCommand.cancel(chatId, this.bot);
        await this.editCommand.cancelEdit(chatId, this.bot);
        break;
      default:
        await this.bot.sendMessage(chatId, '❌ Unknown command. Use /help to see available commands.');
    }
  }

  // Handle callback queries
  async handleCallbackQuery(callbackQuery) {
    const data = callbackQuery.data;
    
    // Handle add command callbacks
    if (this.addCommand.isInAddMode(callbackQuery.message.chat.id)) {
      const handled = await this.addCommand.handleCallbackQuery(callbackQuery, this.bot);
      if (handled) return;
    }

    // Handle edit command callbacks
    if (this.editCommand.isInEditMode(callbackQuery.message.chat.id)) {
      const handled = await this.editCommand.handleCallbackQuery(callbackQuery, this.bot);
      if (handled) return;
    }

    // Handle delete callbacks
    if (data.startsWith('delete_confirm_')) {
      const rowIndex = parseInt(data.replace('delete_confirm_', ''));
      await this.handleDeleteConfirm(callbackQuery, rowIndex);
      return;
    }
    
    if (data === 'delete_cancel') {
      await this.bot.answerCallbackQuery(callbackQuery.id);
      await this.bot.editMessageText('❌ Delete cancelled.', {
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id
      });
      return;
    }
    
    if (data === 'clearall_confirm') {
      await this.handleClearAllConfirm(callbackQuery);
      return;
    }
    
    if (data === 'clearall_cancel') {
      await this.bot.answerCallbackQuery(callbackQuery.id);
      await this.bot.editMessageText('❌ Clear all cancelled.', {
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id
      });
      return;
    }

    // Handle other callbacks here
    console.log('Callback query:', data);
  }

  // Handle regular text messages
  async handleTextMessage(msg) {
    const chatId = msg.chat.id;
    
    // If not in any command mode, show help
    await this.bot.sendMessage(chatId, 
      '💡 Use /add to add a new contact, /help for more commands, or /cancel to stop current operation.'
    );
  }

  // Handle /start command
  async handleStart(msg) {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name;
    
    const welcomeMessage = `👋 *Welcome, ${firstName}!* 👋\n\n` +
                          `I'm your **Contact Management & Reminder Bot** 🤖\n\n` +
                          `*What I can do:*\n` +
                          `• 📝 Add and manage personal contacts\n` +
                          `• 🎂 Send birthday reminders\n` +
                          `• 🎄 Remind about religious and national holidays\n` +
                          `• 📅 Track custom dates (weddings, graduations, etc.)\n` +
                          `• 📊 Store everything in Google Sheets\n\n` +
                          `*Quick Start:*\n` +
                          `Use /add to add your first contact!\n\n` +
                          `*Need help?* Use /help for detailed commands.`;

    await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }

  // Handle /list command
  async handleList(msg) {
    const chatId = msg.chat.id;
    
    try {
      await this.bot.sendMessage(chatId, '📋 Fetching your contacts...');
      
      const contacts = await this.googleSheets.getAllContacts();
      
      if (contacts.length === 0) {
        await this.bot.sendMessage(chatId, '📭 No contacts found. Use /add to add your first contact!');
        return;
      }

      // Group contacts by tier for better organization
      const contactsByTier = {
        'gold': [],
        'family': [],
        'friend': [],
        'acquaintance': []
      };

      contacts.forEach(contact => {
        contactsByTier[contact.tier].push(contact);
      });

      let message = `📋 *Your Contacts (${contacts.length} total)*\n\n`;
      
      Object.entries(contactsByTier).forEach(([tier, tierContacts]) => {
        if (tierContacts.length > 0) {
          const tierName = tierContacts[0].getTierDisplayName();
          message += `*${tierName} (${tierContacts.length}):*\n`;
          tierContacts.forEach(contact => {
            const age = contact.getAge();
            const ageText = age ? ` (${age})` : '';
            message += `• ${contact.name}${ageText}\n`;
          });
          message += '\n';
        }
      });

      // Split long messages
      if (message.length > 4096) {
        const chunks = this.splitMessage(message, 4096);
        for (const chunk of chunks) {
          await this.bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' });
        }
      } else {
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }

    } catch (error) {
      console.error('Error listing contacts:', error);
      await this.bot.sendMessage(chatId, '❌ Error fetching contacts. Please try again.');
    }
  }

  // Handle /search command
  async handleSearch(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Extract search term
    const searchTerm = text.replace('/search', '').trim();
    
    if (!searchTerm) {
      await this.bot.sendMessage(chatId, 
        '🔍 *Search Contacts*\n\n' +
        'Usage: /search [name]\n' +
        'Example: /search John',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    try {
      await this.bot.sendMessage(chatId, `🔍 Searching for "${searchTerm}"...`);
      
      const contacts = await this.googleSheets.searchContacts(searchTerm);
      
      if (contacts.length === 0) {
        await this.bot.sendMessage(chatId, `❌ No contacts found matching "${searchTerm}"`);
        return;
      }

      let message = `🔍 *Search Results for "${searchTerm}"*\n\n`;
      
      contacts.forEach(contact => {
        const age = contact.getAge();
        const ageText = age ? ` (${age})` : '';
        const daysUntil = contact.getDaysUntilBirthday();
        const birthdayText = daysUntil !== null ? ` - Birthday in ${daysUntil} days` : '';
        
        message += `*${contact.name}*${ageText}${birthdayText}\n`;
        message += `• Tier: ${contact.getTierDisplayName()}\n`;
        message += `• Religion: ${contact.getReligionDisplayName()}\n`;
        message += `• Nationality: ${contact.getNationalityDisplayName()}\n`;
        if (contact.description) {
          message += `• Description: ${contact.description}\n`;
        }
        message += '\n';
      });

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error searching contacts:', error);
      await this.bot.sendMessage(chatId, '❌ Error searching contacts. Please try again.');
    }
  }

  // Handle /delete command
  async handleDelete(msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Extract contact name from command
    const contactName = text.replace('/delete', '').trim();
    
    if (!contactName) {
      await this.bot.sendMessage(chatId, 
        '🗑️ *Delete Contact*\n\n' +
        'Usage: /delete [contact name]\n' +
        'Example: /delete John Smith',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    try {
      // Find the contact
      const rowIndex = await this.googleSheets.findContactRowIndex(contactName);
      
      if (rowIndex === -1) {
        await this.bot.sendMessage(chatId, `❌ Contact "${contactName}" not found. Use /search to find contacts.`);
        return;
      }

      // Get all contacts to find the exact one
      const contacts = await this.googleSheets.getAllContacts();
      const contact = contacts.find(c => c.name.toLowerCase() === contactName.toLowerCase());
      
      if (!contact) {
        await this.bot.sendMessage(chatId, `❌ Contact "${contactName}" not found.`);
        return;
      }

      // Show confirmation with inline keyboard
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Yes, Delete', callback_data: `delete_confirm_${rowIndex}` },
            { text: '❌ Cancel', callback_data: 'delete_cancel' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, 
        `🗑️ *Delete Contact*\n\n` +
        `Are you sure you want to delete **${contact.name}**?\n\n` +
        `This action cannot be undone.`,
        { 
          parse_mode: 'Markdown',
          reply_markup: keyboard 
        }
      );

    } catch (error) {
      console.error('Error starting delete:', error);
      await this.bot.sendMessage(chatId, '❌ Error starting delete. Please try again.');
    }
  }

  // Handle /clearall command - delete all contacts
  async handleClearAll(msg) {
    const chatId = msg.chat.id;
    
    try {
      // Get all contacts first
      const contacts = await this.googleSheets.getAllContacts();
      
      if (contacts.length === 0) {
        await this.bot.sendMessage(chatId, '📭 No contacts to delete.');
        return;
      }

      // Show confirmation with inline keyboard
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🗑️ Yes, Delete ALL', callback_data: 'clearall_confirm' },
            { text: '❌ Cancel', callback_data: 'clearall_cancel' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, 
        `🗑️ *Delete All Contacts*\n\n` +
        `⚠️ **WARNING: This will delete ALL ${contacts.length} contacts!**\n\n` +
        `This action cannot be undone.\n` +
        `Are you absolutely sure?`,
        { 
          parse_mode: 'Markdown',
          reply_markup: keyboard 
        }
      );

    } catch (error) {
      console.error('Error starting clear all:', error);
      await this.bot.sendMessage(chatId, '❌ Error starting clear all. Please try again.');
    }
  }

  // Handle delete confirmation
  async handleDeleteConfirm(callbackQuery, rowIndex) {
    const chatId = callbackQuery.message.chat.id;
    
    try {
      // Delete the contact
      const success = await this.googleSheets.deleteContact(rowIndex);
      
      if (success) {
        await this.bot.answerCallbackQuery(callbackQuery.id, '✅ Contact deleted successfully!');
        await this.bot.editMessageText('✅ Contact deleted successfully!', {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id
        });
      } else {
        throw new Error('Failed to delete contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ Error deleting contact');
      await this.bot.editMessageText('❌ Error deleting contact. Please try again.', {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id
      });
    }
  }

  // Handle clear all confirmation
  async handleClearAllConfirm(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    
    try {
      // Get all contacts to get the count
      const contacts = await this.googleSheets.getAllContacts();
      const totalContacts = contacts.length;
      
      // Delete all contacts by deleting rows from bottom to top
      for (let i = totalContacts - 1; i >= 0; i--) {
        await this.googleSheets.deleteContact(i);
      }
      
      await this.bot.answerCallbackQuery(callbackQuery.id, `✅ All ${totalContacts} contacts deleted!`);
      await this.bot.editMessageText(`✅ All ${totalContacts} contacts have been deleted!`, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id
      });
    } catch (error) {
      console.error('Error clearing all contacts:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, '❌ Error clearing contacts');
      await this.bot.editMessageText('❌ Error clearing contacts. Please try again.', {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id
      });
    }
  }

  // Handle /calendar command
  async handleCalendar(msg) {
    const chatId = msg.chat.id;
    
    try {
      await this.bot.sendMessage(chatId, '📅 Generating your calendar...');
      
      const upcoming = await this.reminderService.getUpcomingReminders(30);
      
      if (upcoming.length === 0) {
        await this.bot.sendMessage(chatId, '📭 No upcoming events in the next 30 days.');
        return;
      }

      let message = `📅 *Upcoming Events (Next 30 Days)*\n\n`;
      
      upcoming.forEach(reminder => {
        if (reminder.type === 'birthday') {
          message += `🎂 *${reminder.contact.name}'s Birthday*\n`;
          message += `📅 ${reminder.daysUntil === 0 ? 'Today!' : `In ${reminder.daysUntil} days`}\n`;
          message += `👥 ${reminder.contact.getTierDisplayName()}\n\n`;
        } else if (reminder.type === 'holiday') {
          message += `📅 *${reminder.holiday.name}*\n`;
          message += `📅 In ${reminder.daysUntil} days\n`;
          message += `🏛️ ${reminder.holiday.category}\n\n`;
        } else if (reminder.type === 'custom') {
          message += `📝 *${reminder.customDate.name}*\n`;
          message += `👤 ${reminder.contact.name}\n`;
          message += `📅 In ${reminder.daysUntil} days\n\n`;
        }
      });

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error generating calendar:', error);
      await this.bot.sendMessage(chatId, '❌ Error generating calendar. Please try again.');
    }
  }

  // Handle /upcoming command
  async handleUpcoming(msg) {
    const chatId = msg.chat.id;
    
    try {
      await this.bot.sendMessage(chatId, '🔮 Checking upcoming events...');
      
      const upcoming = await this.reminderService.getUpcomingReminders(7);
      
      if (upcoming.length === 0) {
        await this.bot.sendMessage(chatId, '📭 No upcoming events in the next 7 days.');
        return;
      }

      let message = `🔮 *Upcoming This Week*\n\n`;
      
      upcoming.forEach(reminder => {
        if (reminder.type === 'birthday') {
          message += `🎂 *${reminder.contact.name}'s Birthday*\n`;
          message += `📅 ${reminder.daysUntil === 0 ? 'Today!' : `In ${reminder.daysUntil} days`}\n\n`;
        } else if (reminder.type === 'holiday') {
          message += `📅 *${reminder.holiday.name}*\n`;
          message += `📅 In ${reminder.daysUntil} days\n\n`;
        } else if (reminder.type === 'custom') {
          message += `📝 *${reminder.customDate.name}*\n`;
          message += `👤 ${reminder.contact.name}\n`;
          message += `📅 In ${reminder.daysUntil} days\n\n`;
        }
      });

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error checking upcoming events:', error);
      await this.bot.sendMessage(chatId, '❌ Error checking upcoming events. Please try again.');
    }
  }

  // Handle /today command
  async handleToday(msg) {
    const chatId = msg.chat.id;
    
    try {
      await this.bot.sendMessage(chatId, '📅 Checking today\'s events...');
      
      const today = new Date();
      const contacts = await this.googleSheets.getAllContacts();
      
      const todayBirthdays = contacts.filter(contact => {
        const birthday = new Date(contact.birthday);
        return birthday.getMonth() === today.getMonth() && birthday.getDate() === today.getDate();
      });

      if (todayBirthdays.length === 0) {
        await this.bot.sendMessage(chatId, '📭 No birthdays today.');
        return;
      }

      let message = `🎉 *Birthdays Today!* 🎉\n\n`;
      
      todayBirthdays.forEach(contact => {
        const age = contact.getAge();
        const ageText = age ? ` (turning ${age + 1})` : '';
        message += `🎂 *${contact.name}*${ageText}\n`;
        message += `👥 ${contact.getTierDisplayName()}\n`;
        if (contact.description) {
          message += `📝 ${contact.description}\n`;
        }
        message += '\n';
      });

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error checking today\'s events:', error);
      await this.bot.sendMessage(chatId, '❌ Error checking today\'s events. Please try again.');
    }
  }

  // Handle /export command
  async handleExport(msg) {
    const chatId = msg.chat.id;
    
    try {
      await this.bot.sendMessage(chatId, '📊 Preparing your export...');
      
      const csvData = await this.googleSheets.exportToCSV();
      
      // Create a buffer with the CSV data
      const buffer = Buffer.from(csvData, 'utf8');
      
      // Send the file
      await this.bot.sendDocument(chatId, buffer, {
        filename: `contacts_${new Date().toISOString().split('T')[0]}.csv`,
        caption: '📊 Your contacts exported to CSV'
      });

    } catch (error) {
      console.error('Error exporting contacts:', error);
      await this.bot.sendMessage(chatId, '❌ Error exporting contacts. Please try again.');
    }
  }

  // Handle /help command
  async handleHelp(msg) {
    const chatId = msg.chat.id;
    
    const helpMessage = `📚 *Contact Management Bot - Help*\n\n` +
                       `*Available Commands:*\n\n` +
                       `🎯 *Contact Management*\n` +
                       `• /add - Add a new contact\n` +
                       `• /edit - Edit an existing contact\n` +
                       `• /delete [name] - Delete a specific contact\n` +
                       `• /clearall - Delete all contacts\n` +
                       `• /list - Show all contacts\n` +
                       `• /search [name] - Find specific contact\n` +
                       `• /cancel - Cancel current operation\n\n` +
                       `📅 *Calendar & Reminders*\n` +
                       `• /calendar - Show yearly calendar\n` +
                       `• /upcoming - Show next 7 days\n` +
                       `• /today - Show today's birthdays\n\n` +
                       `📊 *Data Management*\n` +
                       `• /export - Export contacts to CSV\n\n` +
                       `*Features:*\n` +
                       `• 🎂 Birthday reminders with tier-based priority\n` +
                       `• 📅 Natural language date input (e.g., "March 16 2007")\n` +
                       `• ⛪ Religious holiday reminders\n` +
                       `• 🇺🇸 National holiday reminders\n` +
                       `• 📝 Custom date tracking\n` +
                       `• 📊 Google Sheets integration\n\n` +
                       `*Need more help?* Contact the bot administrator.`;

    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  // Send error message
  async sendErrorMessage(chatId) {
    await this.bot.sendMessage(chatId, 
      '❌ An error occurred. Please try again or use /help for assistance.'
    );
  }

  // Split long messages
  splitMessage(message, maxLength) {
    const chunks = [];
    let currentChunk = '';
    
    const lines = message.split('\n');
    
    for (const line of lines) {
      if ((currentChunk + line + '\n').length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        // If a single line is too long, split it
        if (line.length > maxLength) {
          const words = line.split(' ');
          let tempLine = '';
          
          for (const word of words) {
            if ((tempLine + word + ' ').length > maxLength) {
              if (tempLine) {
                chunks.push(tempLine.trim());
                tempLine = '';
              }
              tempLine = word + ' ';
            } else {
              tempLine += word + ' ';
            }
          }
          
          if (tempLine) {
            currentChunk = tempLine;
          }
        } else {
          currentChunk = line + '\n';
        }
      } else {
        currentChunk += line + '\n';
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  // Start the bot
  start() {
    console.log('🚀 Starting Contact Management Bot...');
    console.log('📱 Bot is now listening for messages...');
    
    // Test Google Sheets connection
    this.googleSheets.testConnection().then(result => {
      if (result.success) {
        console.log(`✅ Connected to Google Sheets: ${result.spreadsheetTitle}`);
      } else {
        console.error(`❌ Google Sheets connection failed: ${result.error}`);
      }
    });
  }

  // Stop the bot
  stop() {
    console.log('🛑 Stopping Contact Management Bot...');
    this.bot.stopPolling();
  }
}

// Create and start the bot
const bot = new ContactManagementBot();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  bot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  bot.stop();
  process.exit(0);
});

// Start the bot
bot.start();
