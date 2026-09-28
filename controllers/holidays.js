const HOLIDAY = require("../models/holiday");
const moment = require("moment");

exports.all = async (req, res, next) => {
  try {
    let currentMonth, currentYear;
    let monthAllHolidays = [];
    if (req.query.selectedYear && req.query.selectedMonth) {
      currentMonth = req.query.selectedMonth;
      currentYear = req.query.selectedYear;
    } else if (req.query.year && req.query.month && req.query.element) {
      await HOLIDAY.deleteOne({ _id: req.query.element });
      currentMonth = req.query.month;
      currentYear = req.query.year;
    } else {
      currentMonth = moment(new Date()).format("MM");
      currentYear = moment(new Date()).format("YYYY");
    }

    const allHolidayRecords = await HOLIDAY.find({ status: 0 });
    allHolidayRecords.forEach((element, index, array) => {
      let res = element.holidayDate.split("/");
      if (res[1] == currentMonth && res[2] == currentYear) {
        let revStr=element.holidayDate;
        revStr=revStr.split("/");
        revStr=revStr[2]+"-"+revStr[1]+"-"+revStr[0];
        element.holidayDate=moment(revStr).format("DD MMM YYYY");
        monthAllHolidays.push(element);
      }
    });

    let fullMonth = currentYear + "-" + currentMonth;
    return res.sendRender("admin/holidays", null, null, {
      monthAllHolidays: monthAllHolidays,
      selectedMonth: fullMonth,
      sideTab: "setHolidays",
      moment:moment,
      noOfmonth:(currentMonth-1)
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    let holiday = [];
    let choosenHolidays = [];
    let availableMsg = "No";
    let holidayDateValue = null;
    let holidayReasonValue = null;
    if (req.query.holidayDate || req.query.holidayReason) {
      req.query.holidayDate = moment(req.query.holidayDate).format(
        "DD/MM/YYYY"
      );
      const allHolidayRecords = await HOLIDAY.find();
      allHolidayRecords.forEach((element, index, array) => {
        if (req.query.holidayDate === element.holidayDate) {
          choosenHolidays.push(element);
        }
      });
      if (choosenHolidays.length > 0) {
        availableMsg = "Yes";
        holidayDateValue = req.query.holidayDate;
        holidayReasonValue = req.query.holidayReason;
      } else {
        await HOLIDAY.create({
          holidayDate: req.query.holidayDate,
          holidayReason: req.query.holidayReason,
        });
      }
      holiday = await HOLIDAY.find({ status: 1 });
    } 
    else if (req.query.deleteHoliday) {
      await HOLIDAY.deleteOne({ _id: req.query.deleteHoliday });
      holiday = await HOLIDAY.find({ status: 1 });
    }
    return res.sendRender("admin/addHolidays", null, null, {
      holidayData: holiday,
      sideTab: "setHolidays",
      availableMsgM: availableMsg,
      holidayDateValue: holidayDateValue,
      holidayReasonValue: holidayReasonValue,
      moment:moment
    });
  } catch (error) {
    next(error);
  }
};

exports.save = async (req, res, next) => {
  try {
    const _query = { status: 1 };
    const employee = await HOLIDAY.updateMany(
      _query,
      { $set: { status: 0 } },
      { new: true }
    );
    return res.redirect("/admin/holidays");
  } catch (error) {
    next(error);
  }
};

exports.employeeAll = async (req, res, next) => {
  try {
    let currentMonth, currentYear;
    let monthAllHolidays = [];
    if (req.query.selectedYear && req.query.selectedMonth) {
      currentMonth = req.query.selectedMonth;
      currentYear = req.query.selectedYear;
    } else {
      currentMonth = moment(new Date()).format("MM");
      currentYear = moment(new Date()).format("YYYY");
    }
    const allHolidayRecords = await HOLIDAY.find({ status: 0 });
    allHolidayRecords.forEach((element, index, array) => {
      let res = element.holidayDate.split("/");
      if (res[1] == currentMonth && res[2] == currentYear) {
        let revStr=element.holidayDate;
        revStr=revStr.split("/");
        revStr=revStr[2]+"-"+revStr[1]+"-"+revStr[0];
        element.holidayDate=moment(revStr).format("DD MMM YYYY");
        monthAllHolidays.push(element);
      }
    });
    let fullMonth = currentYear + "-" + currentMonth;
    return res.sendRender("employee/holidays", null, null, {
      monthAllHolidays: monthAllHolidays,
      employeeSelectedMonth: fullMonth,
      moment:moment,
      selectedMonth:(currentMonth-1),
      sideTab: "userHolidays",
    });
  } catch (error) {
    next(error);
  }
};