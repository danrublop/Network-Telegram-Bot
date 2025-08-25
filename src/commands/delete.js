const GoogleSheetsService = require('../services/googleSheets');

class DeleteCommand {
  constructor() {
    this.googleSheets = new GoogleSheetsService();
  }

  // Handle /delete command
  async handle(msg, bot) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Extract contact name from command
    const contactName = text.replace('/delete', '').trim();
    
    if (!contactName) {
      await bot.sendMessage(chatId, 
        '🗑️ *Delete Contact*\n\n' +
        'Usage: /delete [contact name]\n' +
        'Example: /delete John Smith\n\n' +
        '⚠️ *Warning:* This action cannot be undone!',
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
        await this.bot.sendMessage(chatId, `❌ Contact "${contactName}" not found.`);
        return;
      }

      // Show confirmation message
      const message = `🗑️ *Delete Contact Confirmation*\n\n` +
                     `*Contact to delete:*\n` +
                     `• Name: ${contact.name}\n` +
                     `• Birthday: ${contact.birthday}\n` +
                     `• Tier: ${contact.getTierDisplayName()}\n` +
                     `• Religion: ${contact.getReligionDisplayName()}\n` +
                     `• Nationality: ${contact.getNationalityDisplayName()}\n\n` +
                     `⚠️ *This action cannot be undone!*\n\n` +
                     `Are you sure you want to delete this contact?`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Yes, Delete', callback_data: `delete_confirm_${rowIndex}` },
            { text: '❌ Cancel', callback_data: 'delete_cancel' }
          ]
        ]
      };

      await bot.sendMessage(chatId, message, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error starting delete:', error);
      await bot.sendMessage(chatId, '❌ Error starting delete. Please try again.');
    }
  }

  // Handle callback queries
  async handleCallbackQuery(callbackQuery, bot) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    try {
      if (data === 'delete_cancel') {
        await bot.editMessageText('❌ Delete operation cancelled.', {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id
        });
      } else if (data.startsWith('delete_confirm_')) {
        const rowIndex = parseInt(data.replace('delete_confirm_', ''));
        await this.confirmDelete(chatId, bot, rowIndex, callbackQuery.message.message_id);
      }

      // Answer callback query
      await bot.answerCallbackQuery(callbackQuery.id);
      return true;

    } catch (error) {
      console.error('Error handling delete callback query:', error);
      return false;
    }
  }

  // Confirm and execute delete
  async confirmDelete(chatId, bot, rowIndex, messageId) {
    try {
      // Delete from Google Sheets
      await this.googleSheets.deleteContact(rowIndex);

      const message = `✅ *Contact Deleted Successfully!*\n\n` +
                     `The contact has been permanently removed from your contacts list.`;

      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('Error deleting contact:', error);
      await bot.editMessageText('❌ Error deleting contact. Please try again.', {
        chat_id: chatId,
        message_id: messageId
      });
    }
  }
}

module.exports = DeleteCommand;
