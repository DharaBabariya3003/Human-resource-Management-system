// Delete attendance record.
$.fn.deleteAttendance = function(attendanceId,user,date){
  swal({
    title: "Do you wants to delete attendance?",
    text: "You will not be able to recover all attendance logs.",
    icon: "warning",
    buttons: [
      'No, cancel it!',
      'Yes, I am sure!'
    ],
  }).then(function(isConfirm) {
    if (isConfirm) {
      $.ajax({
        url: `/admin/attendance/delete?attendanceId=${attendanceId}&user=${user}&date=${date}`,
        type: 'DELETE',
        success: function (data, textStatus, xhr) {
          toastr.success("Deleted !!!");
          $.fn.loadAttendancePage();
        }
      });
    }
  })
}

// Delete attendance log.
$.fn.deleteAttendanceLog = function(attendanceLogId,user,date){
  swal({
    title: "Do you wants to delete attendance Log?",
    text: "You will not be able to recover log.",
    icon: "warning",
    buttons: [
      'No, cancel it!',
      'Yes, I am sure!'
    ],
  }).then(function(isConfirm) {
    if (isConfirm) {
      $.ajax({
        url: `/admin/attendance/attendanceLog/delete?attendanceLogId=${attendanceLogId}&user=${user}&date=${date}`,
        type: 'DELETE',
        success: function (data, textStatus, xhr) {
          if(data.status){
            toastr.success("Deleted !!!");
            let attendanceDate = $("#attendanceMonth").val();
            document.location.href = `/admin/attendance/` + user + `/show?selectedDate=` + attendanceDate;
          }else{
            toastr.error("You can't delete this log as there only one log available !!!");
          }
        }
      });
    }
  })
}