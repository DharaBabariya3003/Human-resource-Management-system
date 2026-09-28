$.fn.headerNotificationModule = function(){ 
  $.ajax({
    url : `/admin/notification/view`,
    type:'GET',
    success: function (data, textStatus, xhr) {  
      $.each(data.headerNotifications,function(){
        let arr=[],i=0;
        $.each(this,function(name,value){
          arr[i]=value;
          i=(i+1);
        })
        if(data.headerNotifications.length == 1){
          if(arr[0] === 'Notification is not available right now!'){
            var emptyNotifications = $.fn.notificationNotAvailable();
            $('#headerNotification').append(`${emptyNotifications}`);
            $('#adminNotificationBottom').removeClass("dropdown-menu-footer p-2 text-center");
          }else{
            let imgFilePath;
            if(arr[0] === 'Birthday'){imgFilePath="/assets/images/profiles/birthday.jpeg";}
            else if(arr[0] === 'Employee Anniversary'){imgFilePath="/assets/images/profiles/employeeAnni.jpg";}
            else if(arr[0] === 'Leave Request'){imgFilePath="/assets/images/profiles/leave.png";}
            else if(arr[0] === 'Marriage Anniversary'){imgFilePath="/assets/images/profiles/marriage.jpeg";}
            else if(arr[0] === 'Interview'){imgFilePath="/assets/images/profiles/interview.jpeg";}
            else if(arr[0] === 'Resignation Request'){imgFilePath="/assets/images/profiles/resignation.png";}
            else if(arr[0] === 'Employment'){imgFilePath="/assets/images/profiles/employment.jpeg";}
            else if(arr[0] === 'Bond Complete'){imgFilePath="/assets/images/profiles/bondCompletion.png";}
            

            var availableNotifications = $.fn.notificationAvailable(imgFilePath,arr[1]);
            $('#headerNotification').append(`${availableNotifications}`);
            $('#adminNotificationBottom').append(`<a href="/admin/notification" onclick="$.fn.notificationClickedFunc('notificationPage');">View all</a>`);
          }
        }else{
          let imgFilePath;
          if(arr[0] === 'Birthday'){imgFilePath="/assets/images/profiles/birthday.jpeg";}
          else if(arr[0] === 'Employee Anniversary'){imgFilePath="/assets/images/profiles/employeeAnni.jpg";}
          else if(arr[0] === 'Leave Request'){imgFilePath="/assets/images/profiles/leave.png";}
          else if(arr[0] === 'Marriage Anniversary'){imgFilePath="/assets/images/profiles/marriage.jpeg";}
          else if(arr[0] === 'Interview'){imgFilePath="/assets/images/profiles/interview.jpeg";}
          else if(arr[0] === 'Resignation Request'){imgFilePath="/assets/images/profiles/resignation.png";}
          else if(arr[0] === 'Employment'){imgFilePath="/assets/images/profiles/employment.jpeg";}
          else if(arr[0] === 'Bond Complete'){imgFilePath="/assets/images/profiles/bondCompletion.png";}
                    

          var availableNotifications = $.fn.notificationAvailable(imgFilePath,arr[1]);
          $('#headerNotification').append(`${availableNotifications}`);
        }
        
      })
      if(data.headerNotifications.length > 1){
        $('#adminNotificationBottom').append(`<a href="/admin/notification" onclick="$.fn.notificationClickedFunc('notificationPage');">View all</a>`);
      }
      
      if(data.sideMenuNotificationLength > 0){
        $('#sideMenuNotification').append(`${data.sideMenuNotificationLength}`);
        $('#sideMenuNotification').addClass("sideMenuNotificationCounter");
      }
      if(data.sideMenuNotificationLength > 0){
        $('#headerNotificationCounter').append(`${data.sideMenuNotificationLength}`);
        $('#headerNotificationCounter').addClass("sideMenuNotificationFormat");
      }
      if(data.interviewNotification > 0){
        $('#interviewNotificationCounter').append(`${data.interviewNotification}`);
        $('#interviewNotificationCounter').addClass("sideMenuNotificationCounter");
      }
      if(data.leaveRequestCount > 0){
        $('#sideMenuLeaveRequest').append(`${data.leaveRequestCount}`);
        $('#sideMenuLeaveRequest').addClass("sideMenuNotificationCounter");
      }
    }, 
  });
}

$.fn.employeeSideNotificationModule = function(){ 
  $.ajax({
    url : `/dashboard/notification/view`,
    type:'GET',
    success: function (data, textStatus, xhr) {  
      $.each(data.allEmpsideNotification,function(){
        let arr=[],i=0;
        $.each(this,function(name,value){
          arr[i]=value;
          i=(i+1);
        })
        if(data.allEmpsideNotification.length == 1){
          if(arr[0] === 'Notification is not available right now!'){
            var emptyNotifications = $.fn.notificationNotAvailable();
            $('#employeeHeaderNotification').append(`${emptyNotifications}`);
            $('#employeeNotificationBottom').removeClass("dropdown-menu-footer p-2 text-center");
          }else{
            let imgFilePath;
            if(arr[0] === 'Birthday'){imgFilePath="/assets/images/profiles/birthday.jpeg";}
            else if(arr[0] === 'Employee Anniversary'){imgFilePath="/assets/images/profiles/employeeAnni.jpg";}
            else if(arr[0] === 'Leave Request'){imgFilePath="/assets/images/profiles/leave.png";}
            else if(arr[0] === 'Marriage Anniversary'){imgFilePath="/assets/images/profiles/marriage.jpeg";}
            else if(arr[0] === 'Interview'){imgFilePath="/assets/images/profiles/interview.jpeg";}
            else if(arr[0] === 'Resignation Request'){imgFilePath="/assets/images/profiles/resignation.png";}
            else if(arr[0] === 'Employment'){imgFilePath="/assets/images/profiles/employment.jpeg";}
            else if(arr[0] === 'Bond Complete'){imgFilePath="/assets/images/profiles/bondCompletion.png";}            
            var availableNotifications = $.fn.notificationAvailable(imgFilePath,arr[1]);
            $('#employeeHeaderNotification').append(`${availableNotifications}`);
              $('#employeeNotificationBottom').append(`<a href="/dashboard/notification" onclick="$.fn.empNotificationClickedFunc('notificationPage');">View all</a>`);
            }
        }else{
          let imgFilePath;
          if(arr[0] === 'Birthday'){imgFilePath="/assets/images/profiles/birthday.jpeg";}
          else if(arr[0] === 'Employee Anniversary'){imgFilePath="/assets/images/profiles/employeeAnni.jpg";}
          else if(arr[0] === 'Leave Request'){imgFilePath="/assets/images/profiles/leave.png";}
          else if(arr[0] === 'Marriage Anniversary'){imgFilePath="/assets/images/profiles/marriage.jpeg";}
          else if(arr[0] === 'Interview'){imgFilePath="/assets/images/profiles/interview.jpeg";}
          else if(arr[0] === 'Resignation Request'){imgFilePath="/assets/images/profiles/resignation.png";}
          else if(arr[0] === 'Employment'){imgFilePath="/assets/images/profiles/employment.jpeg";}
          else if(arr[0] === 'Bond Complete'){imgFilePath="/assets/images/profiles/bondCompletion.png";}          
          var availableNotifications = $.fn.notificationAvailable(imgFilePath,arr[1]);
          $('#employeeHeaderNotification').append(`${availableNotifications}`);
        }
        
      })
      if(data.allEmpsideNotification.length > 1){
        $('#employeeNotificationBottom').append(`<a href="/dashboard/notification" onclick="$.fn.empNotificationClickedFunc('notificationPage');">View all</a>`);
      }
      
      if(data.employeeNotificationCount > 0){
        $('#employeeNotificationCount').append(`${data.employeeNotificationCount}`);
        $('#employeeNotificationCount').addClass("sideMenuNotificationFormat");
      }
      if(data.employeeNotificationCount > 0){
        $('#sideMenuNotification').append(`${data.employeeNotificationCount}`);
        $('#sideMenuNotification').addClass("sideMenuNotificationCounter");
      }
    }, 
  });
}

$.fn.notificationNotAvailable = function(){
  return `<div class="item p-3">
  <div class="row gx-2 justify-content-between align-items-center w-50 mx-auto">
    <div class="col-auto align-items-center justify-content-center">
    <img class="round-border align-items-center center-block" src="/assets/images/profiles/noNotification.png" alt="">
    </div><!--//col-->
    <div class="col">
      <div class="info"> 
        <div class="desc"></div>
      </div>
    </div><!--//col--> 
  </div><!--//row-->
  <div class="row noNotification">
    <div class="w-60 mx-auto"><strong>Notification is not available right now!</strong></div>
  </div>
</div><!--//item-->`;
}
$.fn.notificationAvailable = function(imgFilePath,data){
  return `<div class="item p-3">
  <div class="row gx-2 justify-content-between align-items-center">
    <div class="col-auto">
    <img class="profile-image round-border" src=${imgFilePath} alt="">
    </div><!--//col-->
    <div class="col">
      <div class="info"> 
        <div class="desc">${data}</div>
      </div>
    </div><!--//col--> 
  </div><!--//row-->
</div><!--//item-->`;
}

$.fn.notificationPageName = function(data){
  $.ajax({
    url : `/admin/notification/viewed?page=${data}`,
    type:'GET',
    success: function (data, textStatus, xhr) {  
    }, 
  });
}

$.fn.empNotificationPageName = function(data){
  $.ajax({
    url : `/dashboard/notification/viewed?page=${data}`,
    type:'GET',
    success: function (data, textStatus, xhr) {  
    }, 
  });
}
$.fn.viewedHeadernotification = function(data){
  $.ajax({
    url : `/admin/notification/viewed?header=true`,
    type:'GET',
    success: function (data, textStatus, xhr) {
      if(data.status){
        if(data.totalNotification > 0){
          $("#sideMenuNotification").text(`${data.totalNotification}`);
          $("#headerNotificationCounter").text(`${data.totalNotification}`);
          $('#sideMenuNotification').addClass("sideMenuNotificationCounter");
          $('#headerNotificationCounter').addClass("sideMenuNotificationFormat");
        }
      }else{
        $("#sideMenuNotification").text("");
          $("#headerNotificationCounter").text("");
          $('#sideMenuNotification').removeClass("sideMenuNotificationCounter");
          $('#headerNotificationCounter').removeClass("sideMenuNotificationFormat");
      }
      
    }, 
  });
}
$.fn.viewedEmpHeadernotification = function(data){
  $.ajax({
    url : `/dashboard/notification/viewed?header=true`,
    type:'GET',
    success: function (data, textStatus, xhr) {
      if(data.status){
        if(data.totalNotification > 0){
          $("#sideMenuNotification").text(`${data.totalNotification}`);
          $("#employeeNotificationCount").text(`${data.totalNotification}`);
          $('#sideMenuNotification').addClass("sideMenuNotificationCounter");
          $('#employeeNotificationCount').addClass("sideMenuNotificationFormat");
        }
      }else{
        $("#sideMenuNotification").text("");
          $("#employeeNotificationCount").text("");
          $('#sideMenuNotification').removeClass("sideMenuNotificationCounter");
          $('#employeeNotificationCount').removeClass("sideMenuNotificationFormat");
      }
    }, 
  });
}

$.fn.showLogTab = function(){ 
  $.ajax({
    url : `/admin/logs/view`,
    type:'GET',
    success: function (data, textStatus, xhr) {  
      if(data.logStatus){
        let userRole = data.logStatus.trim();
        if(userRole == 'admin'){
        $('#logUser').addClass("showOverTimeMinutes");
        }
      }
    }, 
  });
}

$(document).ready(function () {
  var headerInformationStringObject = window.localStorage.getItem("headerInformation");
  var headerInformationJsonObject = JSON.parse(headerInformationStringObject);
  $( "#user-info-userName").text(`${headerInformationJsonObject.userFullName} ( ${headerInformationJsonObject.userDesignationName.toUpperCase()} )`);
  $( "#user-info-email").text(`${headerInformationJsonObject.userEmail}`);
});