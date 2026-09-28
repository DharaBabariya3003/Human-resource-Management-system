$(document).ready(function () {
  $("#hideModal").click(function () {
    $(".leftDateDiv").hide();
  });
  $("#showModal").click(function () {
    $(".leftDateDiv").show();
  });
});

$(document).on("click", ".open-LeftModalDialog", function () {
  let leftUserId = $(this).data("id");
  let arr=leftUserId.split(",");
  $(".modal-body #leftId").val(arr[0]);
  if(arr[1]!='0000-00-00'){
  $(".modal-body #resignId").val(arr[1]);
  }
});

$(document).ready(function(){
  $('#leftModalDialog').on('hidden.bs.modal', function () {
    $('#Q_A').trigger('reset')
  })
});

