const HOLIDAY = require("../models/holiday");
const moment = require("moment");

exports.getHolidays = async (selectedDate) => {
  try {
    // Get all holidays
    const month = moment(new Date(selectedDate)).format("MM");
    const year = moment(new Date(selectedDate)).format("YYYY");
    

    let holidays = await HOLIDAY.find({status:0},'holidayDate -_id');
    
    let month_holidays = [];
    holidays.map(holiday=>{
      holiday = holiday.holidayDate.split("/");
      if(holiday[2]==year && holiday[1]==month){
        month_holidays.push(holiday[2]+'-'+holiday[1]+"-"+holiday[0]);
      }
    });
    return month_holidays;
  } catch (error) {
    console.log(error);
  }
};

exports.getSundaysForSalary = async (startDate,endDate) => {
  try {
    // Get all Sundays
    let month_sundays = [];
  
    let start = moment(startDate), end = moment(endDate), day = 0;                    
    let result = [];
    let current = start.clone();

    while (current.day(7 + day).isBefore(end)) {
    result.push(current.clone());
    }

    result.map((m) =>{
      let sunday_date= m.format('YYYY-MM-DD');
      month_sundays.push(sunday_date);
      } 
    );
    return month_sundays;
  } catch (error) {
    console.log(error);
  }
};

exports.getSundays = async (monthAndYear) => {
  try {

    const selectedMonth = moment(new Date(monthAndYear)).format("MM");
    const selectedYear = moment(new Date(monthAndYear)).format("YYYY");

    const startDate = moment(selectedYear+"-"+selectedMonth).subtract(1,'months').endOf('month').format("YYYY-MM-DD");
    const endDate = moment(selectedYear+"-"+selectedMonth).add(1,'months').startOf('month').format("YYYY-MM-DD");
    // Get all Sundays
    let month_sundays = [];
  
    let start = moment(startDate), end = moment(endDate), day = 0;                    
    let result = [];
    let current = start.clone();

    while (current.day(7 + day).isBefore(end)) {
    result.push(current.clone());
    }

    result.map((m) =>{
      let sunday_date= m.format('YYYY-MM-DD');
      month_sundays.push(sunday_date);
      } 
    );
    return month_sundays;
  } catch (error) {
    console.log(error);
  }
};

exports.getAllHolidayDates = async () => {
  try {
    // Get all holidays
    let holidays = await HOLIDAY.find({status:0},'holidayDate -_id');
    
    let month_holidays = [];
    holidays.map(holiday=>{
      holiday = holiday.holidayDate.split("/");
      month_holidays.push(holiday[2]+'-'+holiday[1]+"-"+holiday[0]);
    });
    return month_holidays;
  } catch (error) {
    console.log(error);
  }
};
