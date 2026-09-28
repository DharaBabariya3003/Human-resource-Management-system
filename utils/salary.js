const ATTENDANCE = require("../models/attendance");
const { getHolidays,getSundaysForSalary } = require("../utils/getAllHolidays");
const moment = require("moment");

exports.getDateRangeSalaryInfo = async (userID ,startDateOfMonth,endDateOfMonth, month_Year ,salary_amount, leaveCreditType, empJoiningDate, payrollJoiningDate)=>{
  try {
    if(payrollJoiningDate){
      if((moment(month_Year).isSame((moment(new Date(empJoiningDate)).format("YYYY-MM"))))){
        empJoiningDate = payrollJoiningDate;
      }
    }
    
    let salaryObject = {};
    let overtime_rupees = 0,overtime_minutes = 0;
    // User object ID
    const userId = userID;

    // for holiday
    let holiday_salary =0;
    
     
    let total_salary = 0, halfday_cut_salary = 0, working_minutes = 0;
    let halfday_cut_minutes = 0;
    let singleEntryOT,oTRupees;
    
    const start_of_month = startDateOfMonth;
    const end_of_month = endDateOfMonth;

    let totalDays_month = (moment(new Date(end_of_month))).diff(moment(start_of_month), 'days'); //get total days
    
    totalDays_month = (totalDays_month + 1);
    

    const prevMonthLastDate = moment(start_of_month).subtract(1,'days').format("YYYY-MM-DD");
    const nexMonthFirstDate = moment(end_of_month).add(1,'days').format("YYYY-MM-DD");

    let month_sundays = await getSundaysForSalary(prevMonthLastDate,nexMonthFirstDate);

    let startDate = moment(start_of_month).startOf('day').toDate();
    let endDate = moment(end_of_month).endOf('day').toDate();
    startDate = (moment(startDate).format("YYYY-MM-DD"));
    endDate = (moment(endDate).format("YYYY-MM-DD"));

    startDate = (moment.tz(`${startDate} ${"00:00:59"}`, true, "Asia/Kolkata").format());
    endDate = (moment.tz(`${endDate} ${"23:59:59"}`, true, "Asia/Kolkata").format());
    // get array of records for that user id.
    let monthly_attendance = await ATTENDANCE.find({ user: userId,createdAt:{ $gte :startDate ,$lte :endDate },isDeleted: false },'totalTime totalMinutes overTime overtimeCheckout -_id attendanceType createdAt date').sort({createdAt: 1});
    // current salary.
    const salary = salary_amount;

    // Total days of month except sunday.
    const total_days_ofMonth = (totalDays_month-(month_sundays.length));

    // One day salary.
    const one_day_salary = (salary/total_days_ofMonth);

    let all_holidays = await getHolidays(month_Year);
    
    let range_holidays = [];
    let startOfMonthPrevDate = moment(new Date(start_of_month)).subtract(1,'days').format("YYYY-MM-DD");
    let endOfMonthNextDate = moment(new Date(end_of_month)).add(1,'days').format("YYYY-MM-DD");
    all_holidays.map((element)=>{
      if(moment(new Date(element),'YYYY-MM-DD').isBetween(moment(new Date(startOfMonthPrevDate)), moment(new Date(endOfMonthNextDate)))){
        range_holidays.push(element);
      }
    });
    let month_holidays = range_holidays;
    empJoiningDate = moment(new Date(empJoiningDate)).format("YYYY-MM-DD");
    let afterJoiningDateHolidays = [];
    month_holidays.map(holidayDate =>{
      if((moment(new Date(holidayDate)).isSame(new Date(empJoiningDate)) || (moment(new Date(holidayDate)).isAfter(new Date(empJoiningDate))))){
        afterJoiningDateHolidays.push(holidayDate);
      }
    })  
    
    month_holidays = afterJoiningDateHolidays;

    // Merge all holidays and sundays
    let allHolidaysOfMonth = [...month_sundays,...month_holidays];

    monthly_attendance.map((attendance)=>{
    
      // check holiday and sunday
      let presentDate = moment(new Date(attendance.date)).format('YYYY-MM-DD').toString();
      let isHoliday = month_holidays.includes(presentDate);
      let isSunday = month_sundays.includes(presentDate);
      singleEntryOT = 0, oTRupees = 0;
  
      // Check status of date ,is holiday or not
      let status = allHolidaysOfMonth.includes((moment(new Date(attendance.date)).format("YYYY-MM-DD")).toString());
      // split totalTime by :
      let user_totalTime = attendance.totalTime.split(":");
      // convert hours to minutes
      let user_totalTime_toMinutes = parseInt(user_totalTime[0])*60+parseInt(user_totalTime[1]);
  
      let store_user_minutes = 0;
      if(attendance.overtimeCheckout){
        //store users total working minutes
        store_user_minutes = user_totalTime_toMinutes;
        if(status){
          singleEntryOT = store_user_minutes;
        }else if(attendance.overTime){
          singleEntryOT = (store_user_minutes - parseInt(attendance.totalMinutes));
        }
      
        overtime_minutes = overtime_minutes + singleEntryOT;
        // salary of 1 minutes based on users totalMinutes for halfday.
        let oT_minute_salary = (one_day_salary / parseInt(attendance.totalMinutes));
        oTRupees = (singleEntryOT * oT_minute_salary);
        // multiply one min salary with users working for halfday.
        overtime_rupees = overtime_rupees + oTRupees;
  
      }else{
      if(!status){
        if(user_totalTime_toMinutes > parseInt(attendance.totalMinutes)){
          // If user Minutes are greater than att settings totalMinutes
          store_user_minutes = (parseInt(attendance.totalMinutes));
        }else{
          //store users total working minutes
          store_user_minutes = user_totalTime_toMinutes;
          // reaming minutes of user.
          let halfDayMinutes = (parseInt(attendance.totalMinutes) - store_user_minutes);
  
          // Total half day minutes
          halfday_cut_minutes = (halfday_cut_minutes + halfDayMinutes);
  
          // salary of 1 minutes based on users totalMinutes for halfday.
          let one_minute_salary_halfDayMinutes = (one_day_salary / parseInt(attendance.totalMinutes));
          // multiply one min salary with users working for halfday.
          let working_minutes_salary_halfDayMinutes = (halfDayMinutes * one_minute_salary_halfDayMinutes);
          // Total halfday salary of month.
          halfday_cut_salary = halfday_cut_salary + working_minutes_salary_halfDayMinutes;
  
        }
      }
      }
    
      // Total working minutes in month by user
      working_minutes = (working_minutes + store_user_minutes);
      // salary of 1 minutes based on users totalMinutes.
      let one_minute_salary = (one_day_salary / parseInt(attendance.totalMinutes));
      // multiply one min salary with users working
      let working_minutes_salary = (store_user_minutes * one_minute_salary);
      let workingMinutesSalaryOfMode = ((store_user_minutes - singleEntryOT) * one_minute_salary);
  
      // Total salary of month.
      total_salary = (total_salary + working_minutes_salary);
  
    });

    //Deducted salary with total full leave
    let totalFullDayLeave = total_days_ofMonth - (month_holidays.length + monthly_attendance.length);
    totalFullDayLeave = (totalFullDayLeave >= 0)? totalFullDayLeave : 0;

    const halfdayAndFullDaySalary = (halfday_cut_salary + (totalFullDayLeave * one_day_salary));
    salaryObject.halfdayAndFullDaySalary =  halfdayAndFullDaySalary;
    //Full day cut salary
    salaryObject.fullDayCutSalary = (totalFullDayLeave * one_day_salary);

    // Total salary (working minutes salary)
    if(leaveCreditType == 'None'){
      salaryObject.total_salary = (total_salary-overtime_rupees);
      salaryObject.deductedLeaveEncashment = 0;
    }else{
      let leaveEcRupees;
      if(halfdayAndFullDaySalary > one_day_salary){
        leaveEcRupees = one_day_salary;
      }else if(halfdayAndFullDaySalary == 0){
        leaveEcRupees = 0;
      }else{
        leaveEcRupees = halfday_cut_salary;
      }
      //Deducted leave encashment
      salaryObject.deductedLeaveEncashment = leaveEcRupees;
      salaryObject.total_salary = (total_salary - overtime_rupees);
    }


    // Give holiday rupees
    let holiday_rupees = (one_day_salary * (month_holidays.length));
    if(leaveCreditType == 'None'){ total_salary = (total_salary + holiday_rupees); }else{ total_salary = (total_salary + one_day_salary+holiday_rupees); }
    

    // Total days of month
    salaryObject.totalDays =  total_days_ofMonth;
    // Total working days except holidays
    salaryObject.workingDays =  (total_days_ofMonth - month_holidays.length);
    
    //Present days
    salaryObject.monthly_attendance =  monthly_attendance.length;
    //working minutes
    salaryObject.workingMinutes =  (working_minutes - overtime_minutes);
    //Total half day minutes
    salaryObject.halfday_cut_minutes =  halfday_cut_minutes;
    //Half day cut salary
    salaryObject.halfday_cut_salary =  halfday_cut_salary;
    //Present sundays salary
    salaryObject.holiday_salary = holiday_salary;
    //Present salary amount
    salaryObject.salary_amount = salary_amount;
    // Holiday rupees
    salaryObject.holiday_rupees = holiday_rupees;
    // Leave enchashment
    if(leaveCreditType == 'None'){
      salaryObject.leave_cashment = 0;
    }else{
     if(halfdayAndFullDaySalary > one_day_salary){
        salaryObject.leave_cashment = 0;
      }else if(halfdayAndFullDaySalary == 0){
        salaryObject.leave_cashment = one_day_salary;
      }else{
        salaryObject.leave_cashment = (one_day_salary - halfday_cut_salary);
      }
    } 
    // Final Salary
    salaryObject.finalSalary = Math.round(total_salary);
    // Overtime minutes/salary
    salaryObject.overtime_minutes = overtime_minutes;
    salaryObject.overtime_rupees = overtime_rupees;
    salaryObject.employeeTotalFullLeave = totalFullDayLeave;
    return salaryObject;
  } catch (error) {
    console.log(error);
  }
}