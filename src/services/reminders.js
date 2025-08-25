const cron = require('node-cron');
const moment = require('moment-timezone');
const GoogleSheetsService = require('./googleSheets');
const HolidayService = require('./holidays');

class ReminderService {
  constructor(bot) {
    this.bot = bot;
    this.googleSheets = new GoogleSheetsService();
    this.holidayService = new HolidayService();
    this.userTimezone = process.env.USER_TIMEZONE || 'America/New_York';
    this.reminderHour = parseInt(process.env.REMINDER_HOUR) || 8;
    this.reminderMinute = parseInt(process.env.REMINDER_MINUTE) || 0;
    
    this.setupCronJobs();
  }

  // Setup cron jobs for different types of reminders
  setupCronJobs() {
    // Daily morning reminders at 8 AM user timezone
    cron.schedule(`${this.reminderMinute} ${this.reminderHour} * * *`, () => {
      this.sendDailyReminders();
    }, {
      timezone: this.userTimezone
    });

    // Hourly check for upcoming events (for early reminders)
    cron.schedule('0 * * * *', () => {
      this.checkForEarlyReminders();
    });

    console.log(`✅ Reminder service initialized with timezone: ${this.userTimezone}`);
    console.log(`✅ Daily reminders scheduled for ${this.reminderHour}:${this.reminderMinute.toString().padStart(2, '0')} ${this.userTimezone}`);
  }

  // Send daily morning reminders
  async sendDailyReminders() {
    try {
      console.log('🕐 Sending daily reminders...');
      
      // Get today's date in user timezone
      const today = moment().tz(this.userTimezone).startOf('day');
      
      // Send birthday reminders
      await this.sendBirthdayReminders(today);
      
      // Send holiday reminders (1 day before)
      await this.sendHolidayReminders(today);
      
      // Send custom date reminders
      await this.sendCustomDateReminders(today);
      
      console.log('✅ Daily reminders sent successfully');
    } catch (error) {
      console.error('❌ Error sending daily reminders:', error.message);
    }
  }

  // Check for early reminders (3 days before, day before for Gold Tier and Family)
  async checkForEarlyReminders() {
    try {
      const today = moment().tz(this.userTimezone).startOf('day');
      
      // Check for early birthday reminders
      await this.sendEarlyBirthdayReminders(today);
      
    } catch (error) {
      console.error('❌ Error checking for early reminders:', error.message);
    }
  }

  // Send birthday reminders
  async sendBirthdayReminders(today) {
    try {
      const contacts = await this.googleSheets.getAllContacts();
      
      for (const contact of contacts) {
        if (contact.shouldGetBirthdayReminderToday()) {
          await this.sendBirthdayReminder(contact);
        }
      }
    } catch (error) {
      console.error('❌ Error sending birthday reminders:', error.message);
    }
  }

  // Send early birthday reminders (3 days before, day before)
  async sendEarlyBirthdayReminders(today) {
    try {
      const contacts = await this.googleSheets.getAllContacts();
      
      for (const contact of contacts) {
        if (contact.shouldGetEarlyBirthdayReminder()) {
          const daysUntil = contact.getDaysUntilBirthday();
          await this.sendEarlyBirthdayReminder(contact, daysUntil);
        }
      }
    } catch (error) {
      console.error('❌ Error sending early birthday reminders:', error.message);
    }
  }

  // Send holiday reminders
  async sendHolidayReminders(today) {
    try {
      const tomorrow = moment(today).add(1, 'day');
      const upcomingHolidays = this.holidayService.getUpcomingHolidays(1);
      
      for (const holiday of upcomingHolidays) {
        const holidayDate = moment(holiday.date);
        if (holidayDate.isSame(tomorrow, 'day')) {
          await this.sendHolidayReminder(holiday);
        }
      }
    } catch (error) {
      console.error('❌ Error sending holiday reminders:', error.message);
    }
  }

  // Send custom date reminders
  async sendCustomDateReminders(today) {
    try {
      const contactsWithCustomDates = await this.googleSheets.getContactsWithUpcomingCustomDates(1);
      
      for (const item of contactsWithCustomDates) {
        const { contact, upcomingDates } = item;
        
        for (const customDate of upcomingDates) {
          const eventDate = moment(customDate.date);
          if (eventDate.isSame(tomorrow, 'day')) {
            await this.sendCustomDateReminder(contact, customDate);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error sending custom date reminders:', error.message);
    }
  }

  // Send individual birthday reminder
  async sendBirthdayReminder(contact) {
    try {
      const age = contact.getAge();
      const ageText = age ? ` (turning ${age + 1})` : '';
      
      const message = `🎉 *Today is ${contact.name}'s birthday!* 🎂${ageText}\n\n` +
                     `*Reminder about ${contact.name}:*\n` +
                     `${contact.description || 'No description available'}\n\n` +
                     `*Relationship:* ${contact.getTierDisplayName()}\n` +
                     `*Religion:* ${contact.getReligionDisplayName()}\n` +
                     `*Nationality:* ${contact.getNationalityDisplayName()}`;
      
      await this.sendReminderToUser(message);
      console.log(`✅ Birthday reminder sent for ${contact.name}`);
    } catch (error) {
      console.error(`❌ Error sending birthday reminder for ${contact.name}:`, error.message);
    }
  }

  // Send early birthday reminder
  async sendEarlyBirthdayReminder(contact, daysUntil) {
    try {
      const dayText = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
      const message = `📅 *Birthday Reminder*\n\n` +
                     `${contact.name}'s birthday is ${dayText}! 🎂\n\n` +
                     `*Relationship:* ${contact.getTierDisplayName()}\n` +
                     `*Description:* ${contact.description || 'No description available'}`;
      
      await this.sendReminderToUser(message);
      console.log(`✅ Early birthday reminder sent for ${contact.name} (${daysUntil} days)`);
    } catch (error) {
      console.error(`❌ Error sending early birthday reminder for ${contact.name}:`, error.message);
    }
  }

  // Send holiday reminder
  async sendHolidayReminder(holiday) {
    try {
      let message = '';
      
      if (holiday.category === 'christian') {
        const contacts = await this.googleSheets.getContactsByReligion('christian');
        message = this.formatHolidayReminder(holiday, contacts, 'Christian');
      } else if (holiday.category === 'jewish') {
        const contacts = await this.googleSheets.getContactsByReligion('jewish');
        message = this.formatHolidayReminder(holiday, contacts, 'Jewish');
      } else if (holiday.category === 'muslim') {
        const contacts = await this.googleSheets.getContactsByReligion('muslim');
        message = this.formatHolidayReminder(holiday, contacts, 'Muslim');
      } else if (holiday.category === 'hindu') {
        const contacts = await this.googleSheets.getContactsByReligion('hindu');
        message = this.formatHolidayReminder(holiday, contacts, 'Hindu');
      } else if (holiday.category === 'buddhist') {
        const contacts = await this.googleSheets.getContactsByReligion('buddhist');
        message = this.formatHolidayReminder(holiday, contacts, 'Buddhist');
      } else if (holiday.category === 'american') {
        const contacts = await this.googleSheets.getContactsByNationality('american');
        message = this.formatHolidayReminder(holiday, contacts, 'American');
      } else if (holiday.category === 'national') {
        if (holiday.key === 'peruvian_independence') {
          const contacts = await this.googleSheets.getContactsByNationality('peruvian');
          message = this.formatHolidayReminder(holiday, contacts, 'Peruvian');
        } else if (holiday.key === 'dominican_independence') {
          const contacts = await this.googleSheets.getContactsByNationality('dominican');
          message = this.formatHolidayReminder(holiday, contacts, 'Dominican');
        }
      }
      
      if (message) {
        await this.sendReminderToUser(message);
        console.log(`✅ Holiday reminder sent for ${holiday.name}`);
      }
    } catch (error) {
      console.error(`❌ Error sending holiday reminder for ${holiday.name}:`, error.message);
    }
  }

  // Format holiday reminder message
  formatHolidayReminder(holiday, contacts, category) {
    if (contacts.length === 0) {
      return null; // No contacts to remind about this holiday
    }
    
    const emoji = this.getHolidayEmoji(holiday.category);
    const contactsList = contacts.map(contact => `• ${contact.name}`).join('\n');
    
    return `${emoji} *Tomorrow is ${holiday.name}!*\n\n` +
           `Don't forget to wish your ${category} friends:\n` +
           `${contactsList}\n\n` +
           `*Total contacts:* ${contacts.length}`;
  }

  // Send custom date reminder
  async sendCustomDateReminder(contact, customDate) {
    try {
      const message = `📅 *Custom Date Reminder*\n\n` +
                     `*${customDate.name}* for ${contact.name} is tomorrow!\n\n` +
                     `*Date:* ${moment(customDate.date).format('MMM DD, YYYY')}\n` +
                     `*Recurring:* ${customDate.recurring ? 'Yes' : 'No'}\n` +
                     `*Description:* ${contact.description || 'No description available'}`;
      
      await this.sendReminderToUser(message);
      console.log(`✅ Custom date reminder sent for ${contact.name} - ${customDate.name}`);
    } catch (error) {
      console.error(`❌ Error sending custom date reminder for ${contact.name}:`, error.message);
    }
  }

  // Get holiday emoji
  getHolidayEmoji(category) {
    const emojis = {
      'christian': '⛪',
      'jewish': '✡️',
      'muslim': '☪️',
      'hindu': '🕉️',
      'buddhist': '☸️',
      'american': '🇺🇸',
      'national': '🏛️'
    };
    return emojis[category] || '📅';
  }

  // Send reminder to user (you'll need to implement this based on your bot setup)
  async sendReminderToUser(message) {
    try {
      // This should be implemented based on how you want to send reminders
      // For now, we'll just log the message
      console.log('📱 REMINDER MESSAGE:');
      console.log(message);
      console.log('---');
      
      // If you have a specific user ID to send reminders to, you can use:
      // await this.bot.sendMessage(userId, message, { parse_mode: 'Markdown' });
      
    } catch (error) {
      console.error('❌ Error sending reminder to user:', error.message);
    }
  }

  // Get upcoming reminders for a specific date range
  async getUpcomingReminders(days = 30) {
    try {
      const reminders = [];
      
      // Get birthday reminders
      const birthdayContacts = await this.googleSheets.getContactsWithUpcomingBirthdays(days);
      birthdayContacts.forEach(contact => {
        const daysUntil = contact.getDaysUntilBirthday();
        reminders.push({
          type: 'birthday',
          contact: contact,
          date: moment().add(daysUntil, 'days').toDate(),
          daysUntil: daysUntil,
          priority: contact.getReminderPriority()
        });
      });
      
      // Get holiday reminders
      const upcomingHolidays = this.holidayService.getUpcomingHolidays(days);
      upcomingHolidays.forEach(holiday => {
        reminders.push({
          type: 'holiday',
          holiday: holiday,
          date: holiday.date,
          daysUntil: moment(holiday.date).diff(moment(), 'days'),
          priority: 5 // Holidays have medium priority
        });
      });
      
      // Get custom date reminders
      const customDateContacts = await this.googleSheets.getContactsWithUpcomingCustomDates(days);
      customDateContacts.forEach(item => {
        item.upcomingDates.forEach(customDate => {
          const eventDate = moment(customDate.date);
          const daysUntil = eventDate.diff(moment(), 'days');
          reminders.push({
            type: 'custom',
            contact: item.contact,
            customDate: customDate,
            date: eventDate.toDate(),
            daysUntil: daysUntil,
            priority: item.contact.getReminderPriority()
          });
        });
      });
      
      // Sort by priority and date
      return reminders.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.daysUntil - b.daysUntil;
      });
    } catch (error) {
      console.error('❌ Error getting upcoming reminders:', error.message);
      return [];
    }
  }

  // Test reminder system
  async testReminders() {
    try {
      console.log('🧪 Testing reminder system...');
      
      const upcoming = await this.getUpcomingReminders(7);
      console.log(`Found ${upcoming.length} upcoming reminders in the next 7 days:`);
      
      upcoming.forEach(reminder => {
        if (reminder.type === 'birthday') {
          console.log(`🎂 ${reminder.contact.name} - ${reminder.daysUntil} days`);
        } else if (reminder.type === 'holiday') {
          console.log(`📅 ${reminder.holiday.name} - ${reminder.daysUntil} days`);
        } else if (reminder.type === 'custom') {
          console.log(`📝 ${reminder.contact.name} - ${reminder.customDate.name} - ${reminder.daysUntil} days`);
        }
      });
      
      return upcoming;
    } catch (error) {
      console.error('❌ Error testing reminders:', error.message);
      return [];
    }
  }
}

module.exports = ReminderService;
