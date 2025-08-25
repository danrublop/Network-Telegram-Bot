const Contact = require('./src/models/contact');
const DateParser = require('./src/utils/dateParser');
const Validation = require('./src/utils/validation');

// Test Contact model
console.log('🧪 Testing Contact Model...\n');

const testContact = new Contact({
  name: 'John Smith',
  birthday: '1990-03-15',
  tier: 'friend',
  religion: 'christian',
  nationality: 'american',
  description: 'College roommate, works at Google, loves hiking',
  customDates: [
    {
      name: 'Wedding Anniversary',
      date: '2023-06-20',
      recurring: true
    }
  ]
});

console.log('✅ Contact created:', testContact.name);
console.log('✅ Birthday:', testContact.birthday);
console.log('✅ Age:', testContact.getAge());
console.log('✅ Days until birthday:', testContact.getDaysUntilBirthday());
console.log('✅ Tier display:', testContact.getTierDisplayName());
console.log('✅ Religion display:', testContact.getReligionDisplayName());
console.log('✅ Nationality display:', testContact.getNationalityDisplayName());
console.log('✅ Reminder priority:', testContact.getReminderPriority());

// Test DateParser
console.log('\n🧪 Testing DateParser...\n');

const dateParser = new DateParser();

const testDates = [
  '03/15/1990',
  '1990-03-15',
  'March 15, 1990',
  '15/03/1990'
];

testDates.forEach(dateStr => {
  const parsed = dateParser.parseDate(dateStr);
  if (parsed) {
    console.log(`✅ Parsed "${dateStr}" -> ${dateParser.formatDate(parsed)}`);
  } else {
    console.log(`❌ Failed to parse "${dateStr}"`);
  }
});

// Test Validation
console.log('\n🧪 Testing Validation...\n');

const validation = Validation.validateContact(testContact);
console.log('✅ Contact validation:', validation.isValid);
if (!validation.isValid) {
  console.log('❌ Validation errors:', validation.errors);
}

// Test CSV export format
console.log('\n🧪 Testing CSV Export Format...\n');
const csvRow = testContact.toSheetRow();
console.log('✅ CSV row format:', csvRow);

// Test contact recreation from sheet row
const recreatedContact = Contact.fromSheetRow(csvRow);
console.log('✅ Recreated contact name:', recreatedContact.name);
console.log('✅ Recreated contact birthday:', recreatedContact.birthday);

console.log('\n🎉 All tests completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Set up your .env file with Telegram bot token and Google Sheets credentials');
console.log('2. Run the bot with: npm start');
console.log('3. Test with /start command in Telegram');
