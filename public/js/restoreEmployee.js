function restoreEmployee(id){
  let dataId=id;
  swal({
    title: "Are you sure to rejoin user ?",
    text: "You will be able to recover this data",
    icon: "warning",
    buttons: [
      'No, cancel it!',
      'Yes, I am sure!'
    ],
  }).then(function(isConfirm) {
    if (isConfirm) {
      window.location="/admin/leftEmployees/"+dataId+"/restore";
    }
  })
}