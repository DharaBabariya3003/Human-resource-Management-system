$.fn.addLetterheadTypeFuc = function(){
  var letterheadType = $("#letterheadType").val();
  letterheadType = letterheadType.trim();
  if(letterheadType.length == 0){
    $( "#letterheadType" ).focus();
    toastr.error('Letterhead Type name is mandatory.')
  }else{
    $.ajax({
      url : `/admin/letterhead/letterhead-type`,
      type: 'POST',
      contentType: 'application/json',
      data : JSON.stringify({ letterheadType: letterheadType }),
      success: function (data, textStatus, xhr) {
        if(data.status){
          toastr.success("Added !!!");
          $("#letterheadType").val("");
          table.ajax.reload(null, false);
        }else{
          $( "#letterheadType" ).focus();
          toastr.error("Letterhead type already exists !!")
        }
      },
      error: function (error, exception) {
        if(error){
          toastr.error(error.responseJSON.message);
        }
      },
    });
  }
}


/****************************************************************************************************************************/

//Load all letter-head types

var table;
  table = $("#showLetterHeadTypesTable").DataTable({
  "autoWidth": false,
  "scrollX": true,
  "order": [[ 0, 'desc' ]],
  "serverSide": true,
  "ordering": false,
  "serverMethod": 'get',
  'ajax': {
  'url': '/admin/api/letterhead/letterhead-type',
  },
  "columns": [{
    data: "",
    "defaultContent": "-"
  },{
    data: "_id",
    className: 'selectedObjectId hideTd',
  },{
    data: "letterheadType",
    className: 'letterheadTypeVal',
    "defaultContent": "-"
  }, {
  data: "",
    "render": function (data, type, row) {
    return `<a class="btn btn-outline-success btn-round-green-neumorpic editLetterHeadType" data-toggle="tooltip" title="Edit Profile" 
    style="border-radius: 0%;">
    <i class="fas fa-edit"></i>
    </a>`;
  }
  }],
  "fnRowCallback": function(nRow, aData, iDisplayIndex) {
  var oSettings = table.settings()[0];
  $("td:first", nRow).html(oSettings._iDisplayStart + iDisplayIndex + 1);
  return nRow;
  }
});


/****************************************************************************************************************************/

// Edit 
$('#showLetterHeadTypesTable').on('click', '.editLetterHeadType', function () {    
  var tr = $(this).closest('tr');    
  let letterheadTypeVal =  tr.find(".letterheadTypeVal").text();
  let selectedObjectId = tr.find(".selectedObjectId").text();
  let editLetterHeadTypeVal;
  Swal.fire({
      html: `<input type="text" id="editLetterHeadType" class="form-control" value="${letterheadTypeVal}"/>`,
      showCancelButton: true,
      title: 'Edit Letterhead Type',
      confirmButtonText: 'Save',
      confirmButtonColor: '#37a729',
      cancelButtonColor: '#d15858',
      preConfirm: () => {
        var editLetterHeadType = $("#editLetterHeadType").val();
        editLetterHeadTypeVal = editLetterHeadType.trim();
        if(editLetterHeadTypeVal.length == 0){
          $( "#editLetterHeadType" ).focus();
          Swal.showValidationMessage('Letterhead Type name is mandatory.')
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        var letterHeadData = {
          _id: selectedObjectId,
          letterheadType: editLetterHeadTypeVal
        }
        $.ajax({    
          url : `/admin/letterhead/letterhead-type`,
          type: 'PUT',
          contentType: 'application/json',
          data : JSON.stringify(letterHeadData),
          success: function (data, textStatus, xhr) {
            if(data.status){
              toastr.success("Letterhead type has been successfully modified !!!")
              table.ajax.reload(null, false);
            }else{
              toastr.error("Letterhead type already exists !!")
            }
          },
        });
      }
  });  
});


