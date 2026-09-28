var table;
table = $("#letterHeadTable").DataTable({
  "autoWidth": false,
  "scrollX": true,
  "order": [[ 0, 'desc' ]],
  "serverSide": true,
  "ordering": false,
  "serverMethod": 'get',
  'ajax': {
    'url': '/admin/api/letterhead',
  },  
  "columns": [{
    data: "",
    "defaultContent": "-"
  },{
    data: "letterHeadNumber",
    "defaultContent": "-"
  }, {
    data: "issuerName",
    "defaultContent": "-"
  }, {
    data: "issueTo",
    "defaultContent": "-"
  },{
    data: "issueDate",
    "defaultContent": "-",
    "render": function(data, type, row){
      return moment(new Date(row.issueDate)).format("DD MMM YYYY");
    }
  },{
    data: null,
    "defaultContent": "-",
    "render":function(data, type, row){					
      return `${row.letterheadType.letterheadType}`;
    }
  },
  {
  data: "_id",
  "className": "d-flex",
  "render": function (data, type, row) {
    return `	
    <a onclick="showLetterHead('${row._id}')" data-toggle="modal" class="open-LetterViewModalDialog" href="#letterViewModalDialog">
    <button type="button" class="btn btn-outline-primary btn-round-purple-neumorpic" style="border-radius: 0%;margin-right: 5%;" data-toggle="tooltip">
    <i class="fas fa-eye"></i>
    </button>
    </a>

    <a onclick="editLetterHead('${row._id}')" data-toggle="modal" class="open-LetterEditModalDialog" href="#letterEditModalDialog">
    <button type="button" class="btn btn-outline-success btn-round-green-neumorpic" style="border-radius: 0%;margin-right: 5%;" data-toggle="tooltip">
    <i class="fas fa-edit"></i>
    </button>
    </a>
    
    <a onclick="deleteLetterHead('${row._id}')"><button type="button" class="btn btn-outline-danger btn-round-red-neumorpic" style="border-radius: 0%;margin-right: 5%;" data-toggle="tooltip" title="Permanently Delete">
      <i class="fas fa-trash"></i></button></a>`;
   }
  }
    ],
  "fnRowCallback": function(nRow, aData, iDisplayIndex) {
    var oSettings = table.settings()[0];
    $("td:first", nRow).html(oSettings._iDisplayStart + iDisplayIndex + 1);
    return nRow;
  },
});
    
/**********************************************************************************/

$.fn.addLetterHeadFuc = function(){
  var letterHeadNumber = $("#letterHeadNumber").val().trim();
  var issuerName = $("#issuerName").val().trim();
  var issueTo = $("#issueTo").val().trim();

  var issueDate = $("#issueDate").val().trim();
  var letterheadType = $("#letterheadType").val().trim();
  var reason = $("#reason").val().trim();


  var fd = new FormData();
  var letterHeadDocuments = $("#letterHeadDocument")[0].files[0];
  fd.append('letterHeadDocument',letterHeadDocuments);

  
  var note = $("#note").val().trim();

  var letterHeadObject = {
    letterHeadNumber: letterHeadNumber,
    issuerName: issuerName,
    issueTo: issueTo,
    issueDate: issueDate,
    letterheadType: letterheadType,
    reason: reason,
    note: note
  }

  
  fd.append("letterHeadObject",JSON.stringify(letterHeadObject));
  
  $.ajax({
    url : `/admin/letterhead`,
    type: 'POST',
    contentType: false,
    processData: false,
    data : fd,
    success: function (data, textStatus, xhr) {
      //Success message
      toastr.success("Added!!!");
      //Reset form
      $("#createLetterHeadForm")[0].reset();
      $("#issueDate").val(moment().format("YYYY-MM-DD"));


      //Close modal----------
      $('#letterModalDialog').modal('hide');
      
      //Refresh data table
      table.ajax.reload(null, false);
    },
    error: function (error, exception) {
      if(error){
        toastr.error(error.responseJSON.message);
      }
    },
  });
}


/*************************************************************************************/
$.fn.getLetterHeadTypesNames = function(status,selectedLetterheadType){
  if(status.trim() == 'add'){
    document.getElementById("letterheadType").options.length = 0;
  }else{
    document.getElementById("edit_letterheadType").options.length = 0;
  }
  $.ajax({
    url: `/admin/letterhead/letterhead-type/all`,
    type: 'GET',
    success: function (data, textStatus, xhr) {
      if(data && data.length > 0){
        if(status.trim() == 'add'){
          data.map((element) => {
            $('#letterheadType').append(`<option value="${element._id}">${element.letterheadType}</option>`);
          })
       }else{
          data.map((element) => {
            if(element._id == selectedLetterheadType){
              $('#edit_letterheadType').append(`<option selected value="${element._id}">${element.letterheadType}</option>`);
            }else{
              $('#edit_letterheadType').append(`<option value="${element._id}">${element.letterheadType}</option>`);
            }
          })
       }
      }
    }
  });
}

/*************************************************************************************/

$(document).ready(function() {
  $("#issueDate").val(moment().format("YYYY-MM-DD"));
});

/*************************************************************************************/

$.fn.getSingleLetterHeadDetails = function(dataId,status){
  var letterheadId = dataId;
  $.ajax({
    url : `/admin/letterhead/${letterheadId}`,
    type: 'get',
    contentType: 'application/json',
    success: function (data, textStatus, xhr) {
      var firstName="",middleName="",lastName="";
      if(data.createdBy.firstName){
        firstName = data.createdBy.firstName;
      }
      if(data.createdBy.middleName){
        middleName = data.createdBy.middleName;
      }
      if(data.createdBy.lastName){
        lastName = data.createdBy.lastName;
      }

      if(status.trim() == 'add'){
        $("#show_letterHeadNumber").text(data.letterHeadNumber);
        $("#show_issuerName").text(data.issuerName);
        $("#show_issueTo").text(data.issueTo);

        $("#show_issueDate").text(moment(new Date(data.issueDate)).format("DD MMM YYYY"));
        $("#show_letterheadType").text(data.letterheadType.letterheadType);
        $("#show_reason").text(data.reason);

        $("#show_letterHeadDocument").html(`
        <a data-fancybox="gallery" href=${data.letterHeadDocument} class="btn btn-outline-success" data-toggle="tooltip" title="View" style="border-radius: 0%;"><i class="fas fa-eye"></i></a>
				<a href=${data.letterHeadDocument} target="_blank" class="btn btn-outline-primary" data-toggle="tooltip" title="Download" style="border-radius: 0%;"><i class="fa fa-download"></i></a>
        `)


        $("#show_note").text(data.note);
        $("#show_createdBy").text(firstName+" "+middleName+" "+lastName);
      }else{
        $("#edit_letterHeadID").val(data._id);
        $("#edit_letterHeadNumber").val(data.letterHeadNumber);
        $("#edit_issuerName").val(data.issuerName);
        $("#edit_issueTo").val(data.issueTo);

        $("#edit_issueDate").val(moment(new Date(data.issueDate)).format("YYYY-MM-DD"));

        
        $.fn.getLetterHeadTypesNames('update',data.letterheadType._id);
        
        $("#edit_reason").val(data.reason);

        $("#showEditLetterHeadImg").html(`
        <a data-fancybox="gallery" href=${data.letterHeadDocument} class="btn btn-outline-success" data-toggle="tooltip" title="View" style="border-radius: 0%;"><i class="fas fa-eye"></i></a>
				`)
        
        $("#edit_note").text(data.note);
      }
    },
  });
}


function showLetterHead(id){
  let letterheadId = id;
  $.fn.getSingleLetterHeadDetails(letterheadId,'add');
}


/***********************************************************************************/

function deleteLetterHead(id){
  let dataId = id;
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
      $.ajax({
        url: `/admin/letterhead/delete?letterHeadId=${dataId}`,
        type: 'DELETE',
        success: function (data, textStatus, xhr) {
          toastr.success("Deleted !!!");
          //Refresh data table
          table.ajax.reload(null, false);
        }
      });
    }
  })  
}

/****************************************************************************************/

function editLetterHead(id){
  let letterheadId = id;
  $.fn.getSingleLetterHeadDetails(letterheadId,'edit'); 
}

/**************************************************************************/
$.fn.updateLetterHeadFuc = function(){
  var letterHeadID = $("#edit_letterHeadID").val().trim();
  var letterHeadNumber = $("#edit_letterHeadNumber").val().trim();
  var issuerName = $("#edit_issuerName").val().trim();
  var issueTo = $("#edit_issueTo").val().trim();

  var issueDate = $("#edit_issueDate").val().trim();
  var letterheadType = $("#edit_letterheadType").val().trim();
  var reason = $("#edit_reason").val().trim();

  var fd = new FormData();
  var letterHeadDocuments = $("#edit_letterHeadDocument")[0].files[0];
  fd.append('letterHeadDocument',letterHeadDocuments);



  // var letterHeadDocument = $("#edit_letterHeadDocument").val().trim();
  var note = $("#edit_note").val().trim();

  var letterHeadObject = {
    _id: letterHeadID,
    letterHeadNumber: letterHeadNumber,
    issuerName: issuerName,
    issueTo: issueTo,
    issueDate: issueDate,
    letterheadType: letterheadType,
    reason: reason,
    note: note
  }

  fd.append("letterHeadObject",JSON.stringify(letterHeadObject));

  $.ajax({
    url : `/admin/letterhead`,
    type: 'PUT',
    contentType: false,
    processData: false,
    data : fd,
    success: function (data, textStatus, xhr) {
      toastr.success("updated!!!")
      //Close modal----------
      $('#letterEditModalDialog').modal('hide');
      //Refresh data table
      table.ajax.reload(null, false); //-------
    },
    error: function (error, exception) {
      if(error){
        toastr.error(error.responseJSON.message);
      }
    },
  });
}

/***********************************************************************/
function getAllLetterHeadTypesAdd(){
  $.fn.getLetterHeadTypesNames('add',null);
}