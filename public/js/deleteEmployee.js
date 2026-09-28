function deleteEmployee(id){
  let dataId = id;
  swal({
    title: "Are you sure?",
    text: "You will not be able to recover this data",
    icon: "warning",
    buttons: ["No, cancel it!", "Yes, I am sure!"],
  }).then(function (isConfirm) {
    if (isConfirm) {
      window.location = "/admin/leftEmployees/" + dataId + "/delete";
    }
  });
}

function deleteHoliday(id) {
  swal({
    title: "Are you sure?",
    text: "You will not be able to recover this data",
    icon: "warning",
    buttons: ["No, cancel it!", "Yes, I am sure!"],
  }).then(function (isConfirm) {
    if (isConfirm) {
      document.location.href =
          `/admin/holidays/create` + `?deleteHoliday=` + id;
    }
  });
}

function deleteMonthyHoliday(yearAndMonth, id) {
  let res = yearAndMonth.split("-");
  swal({
    title: "Are you sure?",
    text: "You will not be able to recover this data",
    icon: "warning",
    buttons: ["No, cancel it!", "Yes, I am sure!"],
  }).then(function (isConfirm) {
    if (isConfirm) {
      document.location.href =
          `/admin/holidays` +
          `?year=` +
          res[0] +
          `&month=` +
          res[1] +
          `&element=` +
          id;
    }
  });
}
