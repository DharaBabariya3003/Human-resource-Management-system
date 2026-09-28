function deleteBankName(id){ 
  let dataId=id;
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
      window.location="/admin/bankdetails/"+dataId+"/delete";
    }
  })
} 