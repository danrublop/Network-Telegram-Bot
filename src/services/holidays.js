const moment = require('moment-timezone');
const holidaysConfig = require('../../config/holidays.json');

class HolidayService {
  constructor() {
    this.holidays = holidaysConfig;
  }

  // Get all holidays for a specific year
  getHolidaysForYear(year) {
    const allHolidays = [];
    
    Object.keys(this.holidays).forEach(category => {
      Object.keys(this.holidays[category]).forEach(holidayKey => {
        const holiday = this.holidays[category][holidayKey];
        const date = this.calculateHolidayDate(holiday, year);
        
        if (date) {
          allHolidays.push({
            name: holiday.name,
            date: date,
            category: category,
            key: holidayKey,
            type: holiday.type
          });
        }
      });
    });
    
    return allHolidays.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  // Calculate holiday date for a specific year
  calculateHolidayDate(holiday, year) {
    if (holiday.type === 'fixed') {
      return this.calculateFixedHoliday(holiday.date, year);
    } else if (holiday.type === 'calculated') {
      return this.calculateVariableHoliday(holiday.calculation, year);
    }
    return null;
  }

  // Calculate fixed date holidays
  calculateFixedHoliday(dateString, year) {
    const [month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Calculate variable date holidays
  calculateVariableHoliday(calculation, year) {
    switch (calculation) {
      case 'easter':
        return this.calculateEaster(year);
      case 'good_friday':
        return this.calculateGoodFriday(year);
      case 'palm_sunday':
        return this.calculatePalmSunday(year);
      case 'ash_wednesday':
        return this.calculateAshWednesday(year);
      case 'pentecost':
        return this.calculatePentecost(year);
      case 'rosh_hashanah':
        return this.calculateRoshHashanah(year);
      case 'yom_kippur':
        return this.calculateYomKippur(year);
      case 'passover':
        return this.calculatePassover(year);
      case 'sukkot':
        return this.calculateSukkot(year);
      case 'shavuot':
        return this.calculateShavuot(year);
      case 'hanukkah':
        return this.calculateHanukkah(year);
      case 'purim':
        return this.calculatePurim(year);
      case 'tu_bishvat':
        return this.calculateTuBiShvat(year);
      case 'lag_baomer':
        return this.calculateLagBaOmer(year);
      case 'eid_al_fitr':
        return this.calculateEidAlFitr(year);
      case 'eid_al_adha':
        return this.calculateEidAlAdha(year);
      case 'mawlid':
        return this.calculateMawlid(year);
      case 'laylat_al_qadr':
        return this.calculateLaylatAlQadr(year);
      case 'ashura':
        return this.calculateAshura(year);
      case 'diwali':
        return this.calculateDiwali(year);
      case 'holi':
        return this.calculateHoli(year);
      case 'navratri':
        return this.calculateNavratri(year);
      case 'dussehra':
        return this.calculateDussehra(year);
      case 'krishna_janmashtami':
        return this.calculateKrishnaJanmashtami(year);
      case 'buddha_birthday':
        return this.calculateBuddhaBirthday(year);
      case 'vesak':
        return this.calculateVesak(year);
      case 'third_monday_january':
        return this.calculateThirdMonday(year, 0);
      case 'third_monday_february':
        return this.calculateThirdMonday(year, 1);
      case 'last_monday_may':
        return this.calculateLastMonday(year, 4);
      case 'first_monday_september':
        return this.calculateFirstMonday(year, 8);
      case 'second_monday_october':
        return this.calculateSecondMonday(year, 9);
      case 'fourth_thursday_november':
        return this.calculateFourthThursday(year, 10);
      case 'day_after_thanksgiving':
        return this.calculateDayAfterThanksgiving(year);
      default:
        return null;
    }
  }

  // Easter calculation using Meeus/Jones/Butcher algorithm
  calculateEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    
    return new Date(year, month - 1, day);
  }

  // Good Friday (2 days before Easter)
  calculateGoodFriday(year) {
    const easter = this.calculateEaster(year);
    return new Date(easter.getTime() - (2 * 24 * 60 * 60 * 1000));
  }

  // Palm Sunday (7 days before Easter)
  calculatePalmSunday(year) {
    const easter = this.calculateEaster(year);
    return new Date(easter.getTime() - (7 * 24 * 60 * 60 * 1000));
  }

  // Ash Wednesday (46 days before Easter)
  calculateAshWednesday(year) {
    const easter = this.calculateEaster(year);
    return new Date(easter.getTime() - (46 * 24 * 60 * 60 * 1000));
  }

  // Pentecost (49 days after Easter)
  calculatePentecost(year) {
    const easter = this.calculateEaster(year);
    return new Date(easter.getTime() + (49 * 24 * 60 * 60 * 1000));
  }

  // Jewish holidays (simplified calculations)
  calculateRoshHashanah(year) {
    // Rosh Hashanah typically falls in September
    return new Date(year, 8, 15); // Approximate
  }

  calculateYomKippur(year) {
    // Yom Kippur is 10 days after Rosh Hashanah
    const roshHashanah = this.calculateRoshHashanah(year);
    return new Date(roshHashanah.getTime() + (10 * 24 * 60 * 60 * 1000));
  }

  calculatePassover(year) {
    // Passover typically falls in March/April
    return new Date(year, 2, 15); // Approximate
  }

  calculateSukkot(year) {
    // Sukkot is 15 days after Yom Kippur
    const yomKippur = this.calculateYomKippur(year);
    return new Date(yomKippur.getTime() + (15 * 24 * 60 * 60 * 1000));
  }

  calculateShavuot(year) {
    // Shavuot is 50 days after Passover
    const passover = this.calculatePassover(year);
    return new Date(passover.getTime() + (50 * 24 * 60 * 60 * 1000));
  }

  calculateHanukkah(year) {
    // Hanukkah typically starts in December
    return new Date(year, 11, 15); // Approximate
  }

  calculatePurim(year) {
    // Purim typically falls in March
    return new Date(year, 2, 10); // Approximate
  }

  calculateTuBiShvat(year) {
    // Tu BiShvat typically falls in January/February
    return new Date(year, 0, 15); // Approximate
  }

  calculateLagBaOmer(year) {
    // Lag BaOmer is 33 days after Passover
    const passover = this.calculatePassover(year);
    return new Date(passover.getTime() + (33 * 24 * 60 * 60 * 1000));
  }

  // Muslim holidays (simplified calculations)
  calculateEidAlFitr(year) {
    // Eid al-Fitr typically falls in May/June
    return new Date(year, 4, 15); // Approximate
  }

  calculateEidAlAdha(year) {
    // Eid al-Adha typically falls in July/August
    return new Date(year, 6, 15); // Approximate
  }

  calculateMawlid(year) {
    // Mawlid typically falls in October/November
    return new Date(year, 9, 15); // Approximate
  }

  calculateLaylatAlQadr(year) {
    // Laylat al-Qadr typically falls in April/May
    return new Date(year, 3, 15); // Approximate
  }

  calculateAshura(year) {
    // Ashura typically falls in August/September
    return new Date(year, 7, 15); // Approximate
  }

  // Hindu holidays (simplified calculations)
  calculateDiwali(year) {
    // Diwali typically falls in October/November
    return new Date(year, 9, 15); // Approximate
  }

  calculateHoli(year) {
    // Holi typically falls in March
    return new Date(year, 2, 15); // Approximate
  }

  calculateNavratri(year) {
    // Navratri typically falls in September/October
    return new Date(year, 8, 15); // Approximate
  }

  calculateDussehra(year) {
    // Dussehra typically falls in October
    return new Date(year, 9, 15); // Approximate
  }

  calculateKrishnaJanmashtami(year) {
    // Krishna Janmashtami typically falls in August/September
    return new Date(year, 7, 15); // Approximate
  }

  // Buddhist holidays (simplified calculations)
  calculateBuddhaBirthday(year) {
    // Buddha's Birthday typically falls in May
    return new Date(year, 4, 15); // Approximate
  }

  calculateVesak(year) {
    // Vesak typically falls in May
    return new Date(year, 4, 15); // Approximate
  }

  // American federal holidays
  calculateThirdMonday(year, month) {
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const daysToAdd = dayOfWeek === 1 ? 14 : (15 - dayOfWeek) % 7;
    return new Date(year, month, 1 + daysToAdd);
  }

  calculateLastMonday(year, month) {
    const lastDay = new Date(year, month + 1, 0);
    const dayOfWeek = lastDay.getDay();
    const daysToSubtract = dayOfWeek === 1 ? 0 : dayOfWeek;
    return new Date(year, month, lastDay.getDate() - daysToSubtract);
  }

  calculateFirstMonday(year, month) {
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const daysToAdd = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7;
    return new Date(year, month, 1 + daysToAdd);
  }

  calculateSecondMonday(year, month) {
    const firstMonday = this.calculateFirstMonday(year, month);
    return new Date(firstMonday.getTime() + (7 * 24 * 60 * 60 * 1000));
  }

  calculateFourthThursday(year, month) {
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const daysToAdd = dayOfWeek <= 4 ? (4 - dayOfWeek) : (11 - dayOfWeek);
    return new Date(year, month, 1 + daysToAdd + 21);
  }

  calculateDayAfterThanksgiving(year) {
    const thanksgiving = this.calculateFourthThursday(year, 10);
    return new Date(thanksgiving.getTime() + (24 * 60 * 60 * 1000));
  }

  // Get upcoming holidays
  getUpcomingHolidays(days = 30) {
    const today = new Date();
    const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    const currentYear = today.getFullYear();
    
    let allHolidays = [];
    
    // Get holidays for current and next year
    [currentYear, currentYear + 1].forEach(year => {
      const yearHolidays = this.getHolidaysForYear(year);
      allHolidays = allHolidays.concat(yearHolidays);
    });
    
    return allHolidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate >= today && holidayDate <= futureDate;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  // Get holidays for a specific religion
  getHolidaysForReligion(religion, year = new Date().getFullYear()) {
    if (!this.holidays[religion]) return [];
    
    const religionHolidays = [];
    Object.keys(this.holidays[religion]).forEach(holidayKey => {
      const holiday = this.holidays[religion][holidayKey];
      const date = this.calculateHolidayDate(holiday, year);
      
      if (date) {
        religionHolidays.push({
          name: holiday.name,
          date: date,
          category: religion,
          key: holidayKey,
          type: holiday.type
        });
      }
    });
    
    return religionHolidays.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  // Get holidays for a specific nationality
  getHolidaysForNationality(nationality, year = new Date().getFullYear()) {
    if (nationality === 'american') {
      return this.getHolidaysForReligion('american', year);
    } else if (nationality === 'peruvian' || nationality === 'dominican') {
      return this.getHolidaysForReligion('national', year).filter(holiday => {
        if (nationality === 'peruvian') {
          return holiday.key === 'peruvian_independence';
        } else if (nationality === 'dominican') {
          return holiday.key === 'dominican_independence';
        }
        return false;
      });
    }
    return [];
  }

  // Check if a specific date is a holiday
  isHoliday(date, religion = null, nationality = null) {
    const year = date.getFullYear();
    let holidays = [];
    
    if (religion && religion !== 'none') {
      holidays = holidays.concat(this.getHolidaysForReligion(religion, year));
    }
    
    if (nationality && nationality !== 'none') {
      holidays = holidays.concat(this.getHolidaysForNationality(nationality, year));
    }
    
    const dateString = date.toISOString().split('T')[0];
    return holidays.find(holiday => {
      const holidayDate = new Date(holiday.date);
      const holidayDateString = holidayDate.toISOString().split('T')[0];
      return holidayDateString === dateString;
    });
  }
}

module.exports = HolidayService;
