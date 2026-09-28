function storeHoliday(e) {
  let holidayDate = document.getElementById("holidayDate").value;
  let holidayReason = document.getElementById("holidayReason").value;
  if (!holidayReason) {    
    toastr.error("Holiday reason is not allow to be empty");
    return false;
  } else {
    $("#selectDateMsg").html("");
    document.location.href =
      `/admin/holidays/create` +
      `?holidayDate=` +
      holidayDate +
      `&holidayReason=` +
      holidayReason;
  }
}

function dateAlreadyInserted()
{
  toastr.error("Selected date is already added!");
}

function selectMonthForHoliday(e) {
  let str = e.target.value;
  let res = str.split("-");
  document.location.href =
    `/admin/holidays` + `?selectedYear=` + res[0] + `&selectedMonth=` + res[1];
}

function employeeSelectMonthForHoliday(e) {
  let str = e.target.value;
  let res = str.split("-");
  document.location.href =
    `/dashboard/holidays` +
    `?selectedYear=` +
    res[0] +
    `&selectedMonth=` +
    res[1];
}
