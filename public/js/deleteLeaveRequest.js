$(document).ready(function(){
    $(".deleteLeave").click(function(){
      let dataId=$(this).data("id");
      swal({
        title: "Are you sure?",
        text: "You will not be able to recover this data",
        icon: "warning",
        buttons: [
          'No, cancel it!',
          'Yes, I am sure!'
        ],
      }).then(function(isConfirm) {
        if (isConfirm) {
          window.location="/admin/leaveRequests/"+dataId+"/cancel";   
        }
      })
    });
});