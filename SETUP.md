# 🚀 Telegram Contact Management Bot - Setup Guide

This guide will walk you through setting up your Telegram Contact Management Bot step by step.

## 📋 Prerequisites

Before you begin, make sure you have:
- Node.js 16+ installed on your system
- A Telegram account
- A Google account with access to Google Sheets
- Basic familiarity with command line tools

## 🔧 Step 1: Telegram Bot Setup

### 1.1 Create a Bot with BotFather

1. Open Telegram and search for `@BotFather`
2. Start a chat with BotFather
3. Send `/newbot` command
4. Choose a name for your bot (e.g., "Contact Manager Bot")
5. Choose a username for your bot (must end with 'bot', e.g., "contact_manager_bot")
6. BotFather will give you a **Bot Token** - save this securely!

### 1.2 Test Your Bot

1. Search for your bot's username in Telegram
2. Start a chat with `/start`
3. You should see a welcome message

## 📊 Step 2: Google Sheets Setup (Choose Your Method)

### 🚀 **Option A: Google Apps Script (Recommended - Much Simpler!)**

This approach takes **5 minutes** and doesn't require any API keys or service accounts!

1. **Create Google Sheet**:
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new blank spreadsheet
   - Name it "Contact Management Bot"
   - Copy the **Spreadsheet ID** from the URL

2. **Set up Google Apps Script**:
   - In your sheet, go to **Extensions** → **Apps Script**
   - Replace the default code with the code from `google-apps-script/Code.gs`
   - Deploy as a **Web app** with "Anyone" access
   - Copy the **Web app URL**

3. **Configure your bot**:
   ```env
   GOOGLE_SHEETS_ID=your_spreadsheet_id
   GOOGLE_APPS_SCRIPT_URL=your_web_app_url
   ```

**📖 See `GOOGLE_APPS_SCRIPT_SETUP.md` for detailed instructions!**

---

### 🔧 **Option B: Google Cloud Console (More Complex)**

If you prefer the traditional API approach:

1. **Enable Google Sheets API**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the **Google Sheets API**

2. **Create Service Account**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the service account details

3. **Generate Service Account Key**:
   - Click on your newly created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Choose "JSON" format
   - Download the JSON file and save it securely

4. **Create Google Sheet**:
   - Go to [Google Sheets](https://sheets.google.com/)
   - Create a new blank spreadsheet
   - Copy the **Spreadsheet ID** from the URL

5. **Share Sheet with Service Account**:
   - In your Google Sheet, click "Share" button
   - Add the service account email (found in the JSON file under `client_email`)
   - Give it "Editor" permissions

**⚠️ We recommend Option A (Google Apps Script) as it's much simpler!**

## ⚙️ Step 3: Environment Configuration

### 3.1 Create Environment File

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit the `.env` file with your actual values:

   **For Google Apps Script (Recommended):**
   ```env
   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN=your_actual_bot_token_here
   
   # Google Sheets Configuration (Apps Script)
   GOOGLE_SHEETS_ID=your_actual_spreadsheet_id_here
   GOOGLE_APPS_SCRIPT_URL=your_web_app_url_here
   
   # User Preferences
   USER_TIMEZONE=America/New_York
   
   # Bot Settings
   REMINDER_HOUR=8
   REMINDER_MINUTE=0
   ```

   **For Google Cloud Console (Traditional API):**
   ```env
   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN=your_actual_bot_token_here
   
   # Google Sheets Configuration (API)
   GOOGLE_SHEETS_ID=your_actual_spreadsheet_id_here
   GOOGLE_SERVICE_ACCOUNT_KEY=path_to_your_service_account.json
   
   # User Preferences
   USER_TIMEZONE=America/New_York
   
   # Bot Settings
   REMINDER_HOUR=8
   REMINDER_MINUTE=0
   ```

### 3.2 Configure Based on Your Choice

**If using Google Apps Script (Recommended):**
- Set `GOOGLE_APPS_SCRIPT_URL` to your deployed web app URL
- Leave `GOOGLE_SERVICE_ACCOUNT_KEY` empty or remove it

**If using Google Cloud Console:**
- Set `GOOGLE_SERVICE_ACCOUNT_KEY` to the path of your JSON file
- Leave `GOOGLE_APPS_SCRIPT_URL` empty or remove it

## 📦 Step 4: Install Dependencies

1. Install Node.js dependencies:
   ```bash
   npm install
   ```

2. Verify installation:
   ```bash
   node test.js
   ```
   You should see all tests passing with ✅ marks.

## 🚀 Step 5: Run the Bot

### 5.1 Start the Bot

1. Start the bot in development mode:
   ```bash
   npm run dev
   ```

2. Or start in production mode:
   ```bash
   npm start
   ```

3. You should see:
   ```
   🤖 Contact Management Bot initialized
   🚀 Starting Contact Management Bot...
   📱 Bot is now listening for messages...
   ✅ Google Sheets service initialized successfully
   ✅ Connected to Google Sheets: [Your Sheet Name]
   ✅ Reminder service initialized with timezone: America/New_York
   ✅ Daily reminders scheduled for 8:00 America/New_York
   ```

### 5.2 Test the Bot

1. Go to your bot in Telegram
2. Send `/start` to see the welcome message
3. Send `/help` to see all available commands

## 📱 Step 6: Bot Commands

### Basic Commands

- `/start` - Welcome message and bot introduction
- `/help` - Show all available commands
- `/add` - Add a new contact (interactive)
- `/list` - Show all your contacts
- `/search [name]` - Search for a specific contact
- `/edit [name]` - Edit an existing contact
- `/delete [name]` - Delete a contact
- `/calendar` - Show upcoming events (30 days)
- `/upcoming` - Show upcoming events (7 days)
- `/today` - Show today's birthdays
- `/export` - Export contacts to CSV
- `/cancel` - Cancel current operation

### Example Usage

```
/add
Bot: What's the person's full name?
You: John Smith
Bot: What's John's birthday? (Format: MM/DD/YYYY)
You: 03/15/1990
Bot: What's your relationship tier with John?
[Shows buttons: Gold Tier | Family | Friend | Acquaintance]
```

## 🔍 Step 7: Testing and Verification

### 7.1 Test Contact Addition

1. Use `/add` to add a test contact
2. Verify the contact appears in your Google Sheet
3. Check that all fields are properly formatted

### 7.2 Test Reminder System

1. Add a contact with today's birthday
2. Wait for the daily reminder (8 AM in your timezone)
3. Check console logs for reminder messages

### 7.3 Test Google Sheets Integration

1. Manually edit a contact in Google Sheets
2. Use `/list` to verify changes are reflected
3. Use `/export` to download your contacts

## 🛠️ Step 8: Troubleshooting

### Common Issues

#### Bot Not Responding
- Check if the bot is running (`npm start`)
- Verify your bot token is correct
- Make sure the bot hasn't been blocked

#### Google Sheets Connection Failed
- Verify service account JSON path in `.env`
- Check if Google Sheets API is enabled
- Ensure service account has edit permissions
- Verify spreadsheet ID is correct

#### Reminders Not Working
- Check timezone setting in `.env`
- Verify cron jobs are running (check console logs)
- Ensure bot has permission to send messages

#### Contact Not Found
- Check spelling and case sensitivity
- Use `/list` to see all contacts
- Use `/search` for partial matches

### Debug Mode

Enable debug logging by adding to your `.env`:
```env
DEBUG=true
NODE_ENV=development
```

## 🔒 Step 9: Security Considerations

### Environment Variables
- Never commit `.env` file to version control
- Keep your bot token private
- Secure your service account JSON file

### Google Sheets Permissions
- Only give necessary permissions to service account
- Regularly review and audit access
- Consider using a dedicated Google account for the bot

### Bot Security
- Don't share your bot token publicly
- Monitor bot usage for unusual activity
- Consider implementing rate limiting for production use

## 📈 Step 10: Production Deployment

### Environment Setup
1. Set `NODE_ENV=production` in your `.env`
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start src/bot.js --name "contact-bot"
   pm2 startup
   pm2 save
   ```

### Monitoring
1. Set up logging to files
2. Monitor bot performance and errors
3. Set up alerts for critical failures

### Backup
1. Regularly export your contacts using `/export`
2. Keep backups of your Google Sheet
3. Consider automated backup solutions

## 🎯 Next Steps

Once your bot is running successfully:

1. **Add your first contacts** using `/add`
2. **Test the reminder system** by adding contacts with upcoming birthdays
3. **Explore advanced features** like custom dates and holiday reminders
4. **Customize the bot** by modifying the code to fit your specific needs
5. **Share with friends** and get feedback on usability

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review console logs for error messages
3. Verify all configuration steps were completed
4. Check that all dependencies are properly installed
5. Ensure your Google Sheets and Telegram bot are properly configured

## 🎉 Congratulations!

You've successfully set up your Telegram Contact Management Bot! The bot will now help you:

- ✅ Manage personal contacts with birthdays and important dates
- ✅ Get smart reminders based on relationship tiers
- ✅ Track religious and national holidays
- ✅ Store everything securely in Google Sheets
- ✅ Export your data whenever needed

Enjoy using your new contact management assistant! 🎊
