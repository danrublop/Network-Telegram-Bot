const Contact = require('../models/contact');
const GoogleSheetsService = require('../services/googleSheets');
const Validation = require('../utils/validation');
const DateParser = require('../utils/dateParser');

class AddCommand {
  constructor() {
    this.googleSheets = new GoogleSheetsService();
    this.dateParser = new DateParser();
    this.userStates = new Map(); // Store user conversation states
  }

  // Handle /add command
  async handle(msg, bot) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Initialize user state
    this.userStates.set(chatId, {
      step: 'name',
      contact: new Contact({
        telegramUserId: userId
      }),
      customDates: [],
      previousSteps: []
    });

    const welcomeMessage = `🎯 *Add New Contact*\n\n` +
                          `I'll help you add a new contact. Let's start with the basics!\n\n` +
                          `*Navigation Commands:*\n` +
                          `• /back - Go to previous step\n` +
                          `• /restart - Start over\n` +
                          `• /cancel - Cancel entire process\n\n` +
                          `*What's the person's full name?*`;

    await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }

  // Handle text messages during contact addition
  async handleText(msg, bot) {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    const userState = this.userStates.get(chatId);
    if (!userState) return false; // Not in add mode
    
    // Check for navigation commands first
    if (text === '/back') {
      await this.goBack(chatId, bot, userState);
      return true;
    }
    
    if (text === '/restart') {
      await this.restart(chatId, bot, userState);
      return true;
    }
    
    if (text === '/cancel') {
      await this.cancel(chatId, bot, userState);
      return true;
    }
    
    try {
      switch (userState.step) {
        case 'name':
          await this.handleName(chatId, text, bot, userState);
          break;
        case 'birthday':
          await this.handleBirthday(chatId, text, bot, userState);
          break;
        case 'tier':
          await this.handleTier(chatId, text, bot, userState);
          break;
        case 'religion':
          await this.handleReligion(chatId, text, bot, userState);
          break;
        case 'nationality':
          await this.handleNationality(chatId, text, bot, userState);
          break;
        case 'description':
          await this.handleDescription(chatId, text, bot, userState);
          break;
        case 'description_input':
          await this.handleDescriptionInput(chatId, text, bot, userState);
          break;
        case 'custom_dates':
          await this.handleCustomDates(chatId, text, bot, userState);
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
      console.error('Error in add command:', error);
      await bot.sendMessage(chatId, '❌ An error occurred. Please try again with /add');
      this.userStates.delete(chatId);
      return true;
    }
  }

  // Handle name input
  async handleName(chatId, text, bot, userState) {
    if (!Validation.isValidName(text)) {
      await bot.sendMessage(chatId, '❌ Please enter a valid name (2-100 characters, letters only)');
      return;
    }

    // Store previous step
    userState.previousSteps.push({ step: 'name', data: text.trim() });
    
    userState.contact.name = text.trim();
    userState.step = 'birthday';

    const message = `✅ *Name:* ${userState.contact.name}\n\n` +
                   `*What's ${userState.contact.name}'s birthday?*\n\n` +
                   `*You can use:*\n` +
                   `• Natural language: "March 16 2007", "16 Mar 2007"\n` +
                   `• Standard format: "03/16/2007", "2007-03-16"\n` +
                   `• Short format: "3/16/07"`;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  // Handle birthday input
  async handleBirthday(chatId, text, bot, userState) {
    const birthday = this.dateParser.parseDate(text);
    
    if (!birthday || !Validation.isValidBirthday(birthday)) {
      await bot.sendMessage(chatId, 
        '❌ Please enter a valid birthday.\n\n' +
        '*Examples:*\n' +
        '• "March 16 2007"\n' +
        '• "16 Mar 2007"\n' +
        '• "03/16/2007"\n' +
        '• "2007-03-16"'
      );
      return;
    }

    userState.contact.birthday = this.dateParser.formatDateForSheets(birthday);
    userState.step = 'tier';

    const age = this.dateParser.getAge(birthday);
    const ageText = age ? ` (${age} years old)` : '';
    
    const message = `✅ *Birthday:* ${this.dateParser.formatDate(birthday)}${ageText}\n\n` +
                   `*What's your relationship tier with ${userState.contact.name}?*`;

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

  // Handle tier selection
  async handleTier(chatId, text, bot, userState) {
    // This should be handled by callback query, but fallback to text
    const tierMap = {
      'gold': 'gold',
      'family': 'family',
      'friend': 'friend',
      'acquaintance': 'acquaintance'
    };

    const tier = tierMap[text.toLowerCase()];
    if (!tier) {
      await bot.sendMessage(chatId, '❌ Please select a valid tier from the buttons above');
      return;
    }

    userState.contact.tier = tier;
    userState.step = 'religion';

    const message = `✅ *Tier:* ${userState.contact.getTierDisplayName()}\n\n` +
                   `*What's ${userState.contact.name}'s religion?*`;

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

  // Handle religion selection
  async handleReligion(chatId, text, bot, userState) {
    // This should be handled by callback query, but fallback to text
    const religionMap = {
      'christian': 'christian',
      'muslim': 'muslim',
      'jewish': 'jewish',
      'hindu': 'hindu',
      'buddhist': 'buddhist',
      'none': 'none',
      'other': 'other'
    };

    const religion = religionMap[text.toLowerCase()];
    if (!religion) {
      await bot.sendMessage(chatId, '❌ Please select a valid religion from the buttons above');
      return;
    }

    userState.contact.religion = religion;
    userState.step = 'nationality';

    const message = `✅ *Religion:* ${userState.contact.getReligionDisplayName()}\n\n` +
                   `*What's ${userState.contact.name}'s nationality/heritage?*\n` +
                   `(for national holiday reminders)`;

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

  // Handle nationality selection
  async handleNationality(chatId, text, bot, userState) {
    // This should be handled by callback query, but fallback to text
    const nationalityMap = {
      'american': 'american',
      'peruvian': 'peruvian',
      'dominican': 'dominican',
      'other': 'other',
      'none': 'none'
    };

    const nationality = nationalityMap[text.toLowerCase()];
    if (!nationality) {
      await bot.sendMessage(chatId, '❌ Please select a valid nationality from the buttons above');
      return;
    }

    userState.contact.nationality = nationality;
    userState.step = 'description';

    const message = `✅ *Nationality:* ${userState.contact.getNationalityDisplayName()}\n\n` +
                   `*Tell me about ${userState.contact.name} (description/notes):*\n\n` +
                   `Choose an option below:`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✏️ Add Description', callback_data: 'description_add' },
          { text: '⏭️ Skip Description', callback_data: 'description_skip' }
        ]
      ]
    };

    await bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Handle description input
  async handleDescription(chatId, text, bot, userState) {
    if (text.toLowerCase() === 'skip') {
      userState.contact.description = '';
    } else {
      if (!Validation.isValidDescription(text)) {
        await bot.sendMessage(chatId, '❌ Description too long (max 500 characters)');
        return;
      }
      userState.contact.description = text.trim();
    }

    userState.step = 'custom_dates';

    const message = `✅ *Description:* ${userState.contact.description || 'None'}\n\n` +
                   `*Any special dates for ${userState.contact.name}?*\n` +
                   `(weddings, graduations, work anniversaries, etc.)\n\n` +
                   `Choose an option below:`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📅 Add Custom Date', callback_data: 'custom_date_add' },
          { text: '⏭️ No Custom Dates', callback_data: 'custom_date_none' }
        ]
      ]
    };

    await bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Handle description input when user chooses to add description
  async handleDescriptionInput(chatId, text, bot, userState) {
    if (!Validation.isValidDescription(text)) {
      await bot.sendMessage(chatId, '❌ Description too long (max 500 characters)');
      return;
    }

    userState.contact.description = text.trim();
    userState.step = 'custom_dates';

    const message = `✅ *Description:* ${userState.contact.description}\n\n` +
                   `*Any special dates for ${userState.contact.name}?*\n` +
                   `(weddings, graduations, work anniversaries, etc.)\n\n` +
                   `Choose an option below:`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📅 Add Custom Date', callback_data: 'custom_date_add' },
          { text: '⏭️ No Custom Dates', callback_data: 'custom_date_none' }
        ]
      ]
    };

    await bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Handle custom dates input
  async handleCustomDates(chatId, text, bot, userState) {
    if (text.toLowerCase() === 'none') {
      await this.finalizeContact(chatId, bot, userState);
      return;
    }

    // Start custom date flow
    userState.tempCustomDate = { name: text.trim() };
    userState.step = 'custom_date_date';

    const message = `📅 *Custom Date:* ${userState.tempCustomDate.name}\n\n` +
                   `*When is this event?*\n` +
                   `Format: MM/DD/YYYY (e.g., 06/20/2023)`;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
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
                   `*Any more special dates?*\n` +
                   `Type "none" to finish, or describe another event:`;

    userState.step = 'custom_dates';
    delete userState.tempCustomDate;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  // Finalize contact creation
  async finalizeContact(chatId, bot, userState) {
    try {
      // Validate contact
      const validation = Validation.validateContact(userState.contact);
      if (!validation.isValid) {
        await bot.sendMessage(chatId, `❌ Validation errors:\n${validation.errors.join('\n')}`);
        return;
      }

      // Add to Google Sheets
      await this.googleSheets.addContact(userState.contact);

      const message = `🎉 *Contact Added Successfully!* 🎉\n\n` +
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
      console.error('Error finalizing contact:', error);
      await bot.sendMessage(chatId, '❌ Error saving contact. Please try again.');
      this.userStates.delete(chatId);
    }
  }

  // Handle callback queries (button clicks)
  async handleCallbackQuery(callbackQuery, bot) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const userState = this.userStates.get(chatId);
    
    if (!userState) return false;

    try {
      if (data.startsWith('tier_')) {
        const tier = data.replace('tier_', '');
        userState.contact.tier = tier;
        userState.step = 'religion';
        
        const message = `✅ *Tier:* ${userState.contact.getTierDisplayName()}\n\n` +
                       `*What's ${userState.contact.name}'s religion?*`;

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

        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });

      } else if (data.startsWith('religion_')) {
        const religion = data.replace('religion_', '');
        userState.contact.religion = religion;
        userState.step = 'nationality';
        
        const message = `✅ *Religion:* ${userState.contact.getReligionDisplayName()}\n\n` +
                       `*What's ${userState.contact.name}'s nationality/heritage?*\n` +
                       `(for national holiday reminders)`;

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

        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });

      } else if (data.startsWith('nationality_')) {
        const nationality = data.replace('nationality_', '');
        userState.contact.nationality = nationality;
        userState.step = 'description';
        
        const message = `✅ *Nationality:* ${userState.contact.getNationalityDisplayName()}\n\n` +
                       `*Tell me about ${userState.contact.name} (description/notes):*\n` +
                       `You can skip this by typing "skip"`;

        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'Markdown'
        });

      } else if (data === 'description_add') {
        userState.step = 'description_input';
        const message = `✏️ *Add Description*\n\n` +
                       `Please type a description for ${userState.contact.name}:\n` +
                       `(max 500 characters)`;
        
        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'Markdown'
        });

      } else if (data === 'description_skip') {
        userState.contact.description = '';
        userState.step = 'custom_dates';
        
        const message = `✅ *Description:* None\n\n` +
                       `*Any special dates for ${userState.contact.name}?*\n` +
                       `(weddings, graduations, work anniversaries, etc.)\n\n` +
                       `Choose an option below:`;

        const keyboard = {
          inline_keyboard: [
            [
              { text: '📅 Add Custom Date', callback_data: 'custom_date_add' },
              { text: '⏭️ No Custom Dates', callback_data: 'custom_date_none' }
            ]
          ]
        };

        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });

      } else if (data === 'custom_date_add') {
        userState.step = 'custom_date_name';
        const message = `📅 *Add Custom Date*\n\n` +
                       `Please describe the special event:\n` +
                       `Examples: "Graduation", "Wedding", "Work Anniversary"`;
        
        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'Markdown'
        });

      } else if (data === 'custom_date_none') {
        userState.contact.customDates = [];
        await this.finalizeContact(chatId, bot, userState);
        return;

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
                       `*Any more special dates?*\n` +
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
      console.error('Error handling callback query:', error);
      return false;
    }
  }

  // Check if user is in add mode
  isInAddMode(chatId) {
    return this.userStates.has(chatId);
  }

  // Go back to previous step
  async goBack(chatId, bot, userState) {
    if (!userState.previousSteps || userState.previousSteps.length === 0) {
      await bot.sendMessage(chatId, '❌ No previous step to go back to.');
      return;
    }

    // Get the previous step
    const previousStep = userState.previousSteps.pop();
    
    // Remove the current step data
    delete userState.contact[userState.step];
    
    // Go back to previous step
    userState.step = previousStep.step;
    
    // Ask for the previous step again
    await this.askForStep(chatId, bot, userState);
  }

  // Restart the entire contact addition process
  async restart(chatId, bot, userState) {
    // Reset user state
    this.userStates.set(chatId, {
      step: 'name',
      contact: new Contact({
        telegramUserId: userState.contact.telegramUserId
      }),
      customDates: [],
      previousSteps: []
    });

    await bot.sendMessage(chatId, 
      '🔄 Contact addition restarted!\n\n' +
      '🎯 *What\'s the person\'s full name?*',
      { parse_mode: 'Markdown' }
    );
  }

  // Ask for the current step
  async askForStep(chatId, bot, userState) {
    switch (userState.step) {
      case 'name':
        await bot.sendMessage(chatId, '🎯 *What\'s the person\'s full name?*', { parse_mode: 'Markdown' });
        break;
      case 'birthday':
        const birthdayMessage = `✅ *Name:* ${userState.contact.name}\n\n` +
                               `*What's ${userState.contact.name}'s birthday?*\n\n` +
                               `*You can use:*\n` +
                               `• Natural language: "March 16 2007", "16 Mar 2007"\n` +
                               `• Standard format: "03/16/2007", "2007-03-16"\n` +
                               `• Short format: "3/16/07"`;
        await bot.sendMessage(chatId, birthdayMessage, { parse_mode: 'Markdown' });
        break;
      case 'tier':
        const tierMessage = `✅ *Birthday:* ${this.dateParser.formatDate(userState.contact.birthday)}\n\n` +
                           `*What's your relationship tier with ${userState.contact.name}?*`;
        await this.showTierOptions(chatId, bot, tierMessage);
        break;
      case 'religion':
        const religionMessage = `✅ *Tier:* ${userState.contact.tier}\n\n` +
                               `*What's ${userState.contact.name}'s religion?*`;
        await this.showReligionOptions(chatId, bot, religionMessage);
        break;
      case 'nationality':
        const nationalityMessage = `✅ *Religion:* ${userState.contact.getReligionDisplayName()}\n\n` +
                                  `*What's ${userState.contact.name}'s nationality/heritage?*`;
        await this.showNationalityOptions(chatId, bot, nationalityMessage);
        break;
      case 'description':
        const descriptionMessage = `✅ *Nationality:* ${userState.contact.getNationalityDisplayName()}\n\n` +
                                  `*Tell me about ${userState.contact.name} (description/notes):*\n\n` +
                                  `Choose an option below:`;
        
        const descriptionKeyboard = {
          inline_keyboard: [
            [
              { text: '✏️ Add Description', callback_data: 'description_add' },
              { text: '⏭️ Skip Description', callback_data: 'description_skip' }
            ]
          ]
        };
        
        await bot.sendMessage(chatId, descriptionMessage, { 
          parse_mode: 'Markdown',
          reply_markup: descriptionKeyboard
        });
        break;
      case 'custom_dates':
        const customDatesMessage = `✅ *Description:* ${userState.contact.description || 'None'}\n\n` +
                                   `*Any special dates to remember?*\n` +
                                   `Examples: graduation, wedding, work anniversary\n\n` +
                                   `Choose an option below:`;
        
        const customDatesKeyboard = {
          inline_keyboard: [
            [
              { text: '📅 Add Custom Date', callback_data: 'custom_date_add' },
              { text: '⏭️ No Custom Dates', callback_data: 'custom_date_none' }
            ]
          ]
        };
        
        await bot.sendMessage(chatId, customDatesMessage, { 
          parse_mode: 'Markdown',
          reply_markup: customDatesKeyboard
        });
        break;
    }
  }

  // Cancel add operation
  async cancel(chatId, bot) {
    if (this.userStates.has(chatId)) {
      this.userStates.delete(chatId);
      await bot.sendMessage(chatId, '❌ Contact addition cancelled.');
    }
  }
}

module.exports = AddCommand;
