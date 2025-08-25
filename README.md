# 🤖 Network Telegram Bot

A powerful Telegram bot for managing personal contacts with Google Sheets integration. Features birthday reminders, contact categorization by tier (gold/family/friend), religion/nationality tracking, and custom date reminders.

## ✨ Features

- **Contact Management**: Add, edit, delete, and search contacts
- **Smart Categorization**: Organize contacts by tier (Gold, Family, Friend, Acquaintance)
- **Birthday Reminders**: Never miss important birthdays with automated reminders
- **Custom Date Tracking**: Set reminders for graduation, anniversaries, and other important dates
- **Google Sheets Integration**: All data stored securely in Google Sheets
- **Religion & Nationality Tracking**: Organize contacts by cultural background
- **Export & Backup**: Export contacts to CSV and create backups
- **24/7 Operation**: Runs continuously with PM2 process management

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google account
- Telegram account

### 1. Clone the Repository

```bash
git clone https://github.com/danrublop/Network-Telegram-Bot.git
cd Network-Telegram-Bot
npm install
```

### 2. Set Up BotFather

1. **Open Telegram** and search for [@BotFather](https://t.me/botfather)
2. **Send `/newbot`** command
3. **Choose a name** for your bot (e.g., "My Contact Manager")
4. **Choose a username** (must end with 'bot', e.g., "mycontactmanager_bot")
5. **Copy the bot token** - you'll need this for the next step

### 3. Set Up Google Sheets

1. **Go to [Google Sheets](https://sheets.google.com)**
2. **Create a new blank spreadsheet**
3. **Name it** "Contact Management Bot" (or your preferred name)
4. **Copy the Spreadsheet ID** from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy the part between `/d/` and `/edit`

### 4. Set Up Google Apps Script

1. **In your Google Sheet**, go to **Extensions** → **Apps Script**
2. **Delete all existing code** in the Apps Script editor
3. **Copy and paste** the entire code from `google-apps-script/Code.gs`
4. **Save** the project (Ctrl+S or Cmd+S)
5. **Click Deploy** → **New deployment**
6. **Choose Web app** as the type
7. **Set Execute as**: `Me` (your Google account)
8. **Set Who has access**: `Anyone`
9. **Click Deploy** and **authorize** when prompted
10. **Copy the Web app URL** that's generated

### 5. Configure Environment Variables

1. **Copy the example environment file**:
   ```bash
   cp env.example .env
   ```

2. **Edit `.env`** with your actual values:
   ```env
   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
   
   # Google Sheets Configuration
   GOOGLE_SHEETS_ID=your_spreadsheet_id_here
   GOOGLE_APPS_SCRIPT_URL=your_web_app_url_here
   
   # User Preferences
   USER_TIMEZONE=America/New_York
   
   # Bot Settings
   REMINDER_HOUR=8
   REMINDER_MINUTE=0
   ```

### 6. Start the Bot

```bash
# Start with PM2 (recommended for production)
npm install pm2 --save-dev
npx pm2 start src/bot.js --name contact-bot --time --update-env

# Or start directly
npm start
```

### 7. Set Up Auto-Start (Optional)

```bash
# Enable PM2 to start on system reboot
npx pm2 startup
npx pm2 save
```

## 📱 Available Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot and show main menu |
| `/add` | Add a new contact |
| `/edit` | Edit existing contact |
| `/delete` | Delete a contact |
| `/list` | List all contacts |
| `/search` | Search for contacts |
| `/calendar` | Show upcoming events |
| `/upcoming` | Show next 30 days |
| `/today` | Show today's reminders |
| `/export` | Export contacts to CSV |
| `/help` | Show help information |
| `/cancel` | Cancel current operation |

## 🏗️ Architecture

- **Frontend**: Telegram Bot API
- **Backend**: Node.js with Express-like routing
- **Database**: Google Sheets via Google Apps Script
- **Process Management**: PM2 for production deployment
- **Reminders**: Automated scheduling system

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather | ✅ |
| `GOOGLE_SHEETS_ID` | Google Sheets spreadsheet ID | ✅ |
| `GOOGLE_APPS_SCRIPT_URL` | Apps Script web app URL | ✅ |
| `USER_TIMEZONE` | User's timezone for reminders | ❌ |
| `REMINDER_HOUR` | Hour for daily reminders (0-23) | ❌ |
| `REMINDER_MINUTE` | Minute for daily reminders (0-59) | ❌ |

### Contact Tiers

- **Gold**: Most important contacts
- **Family**: Family members
- **Friend**: Close friends
- **Acquaintance**: Casual acquaintances

## 📊 Data Structure

Each contact stores:
- Name
- Birthday
- Tier (gold/family/friend/acquaintance)
- Religion
- Nationality
- Description
- Custom dates (JSON array)
- Telegram User ID
- Date added

## 🚨 Troubleshooting

### Bot Not Responding
- Check that the bot token is correct
- Verify the bot is running (`npx pm2 status`)
- Check logs (`npx pm2 logs contact-bot`)

### Google Sheets Connection Issues
- Verify the spreadsheet ID is correct
- Ensure the Apps Script web app is deployed
- Check that "Who has access" is set to "Anyone"

### Permission Errors
- Make sure you authorized the Apps Script when prompted
- Try redeploying the web app
- Verify you have access to the Google Sheet

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) for Telegram Bot API wrapper
- [Google Apps Script](https://developers.google.com/apps-script) for Google Sheets integration
- [PM2](https://pm2.keymetrics.io/) for process management

## 📞 Support

If you encounter any issues or have questions:
1. Check the [troubleshooting section](#-troubleshooting)
2. Review the [setup instructions](#-quick-start)
3. Open an [issue](https://github.com/danrublop/Network-Telegram-Bot/issues) on GitHub

---

**Happy Contact Managing! 🎉**
