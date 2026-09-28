$(document).ready(function(){
  $(".deleteIncrementDetails").click(function(){
    let dataId=$(this).data("id");
    let incrementData = dataId.split(",");
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
        let incrementId = incrementData[0];
        let userId = incrementData[1];
        window.location=`/admin/payroll/${userId}/increment/${incrementId}/delete`;
      }
    })
  });
});