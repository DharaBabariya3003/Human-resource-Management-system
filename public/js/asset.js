$.fn.appendAssetTypes = function(){
  $.ajax({
    url: `/admin/assets/assetTypes`,
    type: 'GET',
    success: function (data, textStatus, xhr) {
      document.getElementById("assetType").options.length = 0;
      $('#assetType').append(`<option value="" disabled selected hidden>---Select Asset Category---</option>`);
      document.getElementById("assetName").options.length = 0;
      $('#assetName').append(`<option value="" disabled selected hidden>---Select Brand/Model---</option>`);
      document.getElementById("assetTypeForSearch").options.length = 0;
      $('#assetTypeForSearch').append(`<option value="" disabled selected hidden>---Select Asset Category---</option>`);
      document.getElementById("assetNameForSearch").options.length = 0;
      $('#assetNameForSearch').append(`<option value="" disabled selected hidden>---Select Brand/Model---</option>`);
      if(data.assetTypes && data.assetTypes.length > 0){
        data.assetTypes.map((element) => {
          $('#assetType').append(`<option value="${element._id}">${element.assetType}</option>`);
          $('#assetTypeForSearch').append(`<option value="${element._id}">${element.assetType}</option>`);
        })
      }
    }
  });  
}
/*---------------------------------------------------------------------*/

$(document).ready(function() {
  //On page set set all asset categories in dropdown.
  $.fn.appendAssetTypes();
  // Set default date on issue datepicker
  $("#givenDate").val(moment().format("YYYY-MM-DD"));
  //On page set set all user names in dropdown.
  $.ajax({
    url: `/admin/assets/assetUsers`,
    type: 'GET',
    success: function (data, textStatus, xhr) {
      document.getElementById("userIds").options.length = 0;
      document.getElementById("assetUserIds").options.length = 0;
      if(data.users && data.users.length > 0){
        data.users.map((element) => {
          $('#userIds').append(`<option data-value= '${element._id}' value='${element.firstName+" "+element.middleName+" "+element.lastName+" ("+element.attendanceCode+")"}'> </option>`);
          $('#assetUserIds').append(`<option data-value= '${element._id}' value='${element.firstName+" "+element.middleName+" "+element.lastName+" ("+element.attendanceCode+")"}'> </option>`);
        })
      }
    }
  });
});

/*---------------------------------------------------------------------*/

$.fn.getAssetNames = function(assetType,assetName){
  //for selected asset categary,get all asset names.
  let assetTypeId=$(`#${assetType} :selected`).val();
  document.getElementById(`${assetName}`).options.length = 0;
  $(`#${assetName}`).append(`<option value="" disabled selected hidden>---Select Brand/Model---</option>`);
  $.ajax({
    url: `/admin/assets/assetNames?assetTypeId=${assetTypeId}`,
    type: 'GET',
    success: function (data, textStatus, xhr) {
      if(data.assetNames && data.assetNames.length > 0){
        data.assetNames.map((element) => {
          $(`#${assetName}`).append(`<option value="${element._id}">${element.assetName}</option>`);
        })
      }
    }
  });
}

/*---------------------------------------------------------------------*/
// Search selected asset type and model available at which users.
$.fn.getSearchAssetData = function(){
  var assetType = $("#assetTypeForSearch").val();
  var assetName = $("#assetNameForSearch").val();
  
  if(!assetType){ assetType = ''; }
  if(!assetName){ assetName = ''; }

  $.ajax({
    url : `/admin/assets/search?assetType=${assetType}&assetName=${assetName}`,
    type: 'GET',
    success: function (data, textStatus, xhr) {
      $("#searchAssetTable > tbody").empty();
      if(data && data.length > 0){
        var srNo = 0;
        data.map(element =>{
          let issueDate;
          if(element.givenDate){
            issueDate = moment(new Date(element.givenDate)).format("DD MMM YYYY");
          }else{
            issueDate = '';
          }
          $(`#searchAssetTable tbody`).append(`
          <tr>
            <td>${(++srNo)}</td>
            <td>${element.user.attendanceCode}</td>
            <td>${element.user.firstName+" "+element.user.middleName+" "+element.user.lastName}</td>
            <td>${element.assetName.assetName}</td>
            <td>${element.remark}</td>
            <td>${issueDate}</td>
            <td><button class="btn btn-outline-danger btn-round-red-neumorpic deleteEmpAssetFromSearch" data-id='${element._id}'><i class="fas fa-trash"></i></<button></td>
          </tr>
          `);
        })
      }else{
        toastr.error('No data available !!!')
      }
    },
    error: function (error, exception) {
      if(error){
        toastr.error(error.responseJSON.message);
      }
    },
  });
}

$.fn.searchAssetData = function(){
  $.fn.getSearchAssetData();
}

/*---------------------------------------------------------------------*/

$.fn.addAssetData = function(assetData){
  $.ajax({
    url : `/admin/assets/store`,
    type: 'POST',
    contentType: 'application/json',
    data : JSON.stringify(assetData),
    success: function (data, textStatus, xhr) {
      if(data.asset)  {
        toastr.success("Asset added successfully !!");
        $('#storeAssetDataForm')[0].reset();
        $("#givenDate").val(moment().format("YYYY-MM-DD"));
        document.getElementById("assetName").options.length = 0;
        $('#assetName').append(`<option value="" disabled selected hidden>---Select Brand/Model---</option>`);
      }else{
        toastr.error("Asset is not added !!");
      }
    },
    error: function (error, exception) {
      if(error){
        toastr.error(error.responseJSON.message);
      }
    },
  });
}

/*---------------------------------------------------------------------*/

$.fn.storeAssetData = function(){
  var assetType = $("#assetType").val();
  var assetName = $("#assetName").val();
  var user      = $("#user").val();
  var givenDate = $("#givenDate").val();
  var remark    = $("#remark").val();
  

  if(!assetType){ assetType = ''; }
  if(!assetName){ assetName = ''; }
  
  var assetData = {
	  assetType: assetType,
		assetName: assetName,
    user: user,
    givenDate: givenDate,
    remark: remark
  }

  if(!assetType){
    toastr.error('select asset category');
  }else if(!assetName){
    toastr.error('select brand/model');
  }else if(!user){
    toastr.error('select user name from dropdown');
  }else{
    //Before add asset, check that asset already available to user or not.
    $.ajax({
      url : `/admin/assets/user-asset-info/${assetType}/${user}`,
      type: 'GET',
      success: function (data, textStatus, xhr) {
        if(data.totalAssets > 0){
          swal({
            title: "Do you wants to add asset?",
            text: "Selected asset is already available at user.",
            icon: "warning",
            buttons: [
              'No, cancel it!',
              'Yes, I am sure!'
            ],
          }).then(function(isConfirm) {
            if (isConfirm) {
              $.fn.addAssetData(assetData);    
            }
          })
        }else{
          $.fn.addAssetData(assetData);
        }
      },
    });
  }
}

/*---------------------------------------------------------------------*/

var data = {}; 
$("#userIds option").each(function(i,el) {  
	data[$(el).data("value")] = $(el).val();
});
$('#userId').change(function(){
  var value = $('#userId').val();
	var userId = $('#userIds [value="' + value + '"]').data('value');
	if(!userId){
		$('#user').val("");
		return false;
	}else{
		$('#user').val(userId);
	}
});
$('#userId').keydown(function(){
  $('#user').val("");
});

/*---------------------------------------------------------------------*/

var assetData = {}; 
$("#assetUserIds option").each(function(i,el) {  
	assetData[$(el).data("value")] = $(el).val();
});
$('#assetUserId').change(function(){
  var assetValue = $('#assetUserId').val();
	var assetUserId = $('#assetUserIds [value="' + assetValue + '"]').data('value');
	if(!assetUserId){
		$('#assetUser').val("");
		return false;
	}else{
		$('#assetUser').val(assetUserId);
	}
});
$('#assetUserId').keydown(function(){
  $('#assetUser').val("");
});

/*------------------------------------------------------------------------- */
// Search selected users all assets.
$.fn.findEmployeesAssetData = function(assetUser){
  $.ajax({
    url : `/admin/assets/user?user=${assetUser}`,
    type: 'GET',
    success: function (data, textStatus, xhr) {
     $("#searchEmpAssetTable > tbody").empty();
     if(data && data.length > 0){
        var srNo = 0;
        data.map(element =>{
          let issueDate;
          if(element.givenDate){
            issueDate = moment(new Date(element.givenDate)).format("DD MMM YYYY");
          }else{
            issueDate = "";
          }
          $(`#searchEmpAssetTable tbody`).append(`
          <tr>
            <td>${(++srNo)}</td>
            <td>${element.assetType.assetType}</td>
            <td>${element.assetName.assetName}</td>
            <td>${element.remark}</td>
            <td>${issueDate}</td>
            <td><button class="btn btn-outline-danger btn-round-red-neumorpic deleteEmpAsset" data-id='${element._id}'><i class="fas fa-trash"></i></<button></td>
          </tr>
          `);
        })
      }else{
        toastr.error('No data available !!!')
      }    
    },
    error: function (error, exception) {
      if(error){
        toastr.error(error.responseJSON.message);
      }
    },
  });
}

/*------------------------------------------------------------------------- */

$.fn.searchEmployeesAssetData = function(){
  var assetUser = $('#assetUser').val();
  $.fn.findEmployeesAssetData(assetUser);
} 

/*------------------------------------------------------------------------- */
// Delete asset which is given to user.
$(document).on('click', '.deleteEmpAsset', function() {
  let assetId = $(this).data("id");
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
        url: `/admin/assets/delete?assetId=${assetId}`,
        type: 'DELETE',
        success: function (data, textStatus, xhr) {
          toastr.success("Deleted !!!");
          var assetUser = $('#assetUser').val();
          $.fn.findEmployeesAssetData(assetUser);
        }
      });
    }
  })   
});

// Delete asset which is given to user from search tab.
$(document).on('click', '.deleteEmpAssetFromSearch', function() {
  let assetId = $(this).data("id");
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
        url: `/admin/assets/delete?assetId=${assetId}`,
        type: 'DELETE',
        success: function (data, textStatus, xhr) {
          toastr.success("Deleted !!!");
          $.fn.getSearchAssetData();
        }
      });
    }
  })
});

/*---------------------------------------------------------------------------*/

// Add asset category
$.fn.addAssetTypeFuc = function(){
  Swal.fire({
    html: `<input type="text" id="assetTypeName" class="form-control" placeholder="Asset Category"/>`,
    showCancelButton: true,
    title: 'Add Asset Category',
    confirmButtonText: 'Save',
    confirmButtonColor: '#37a729',
    cancelButtonColor: '#d15858',
    preConfirm: () => {
      var assetTypeName = $("#assetTypeName").val();
      assetTypeNameVal = assetTypeName;
      if(!assetTypeName){
        Swal.showValidationMessage('Asset category name is mandatory.')
      }
    }
  }).then((result) => {
      if (result.isConfirmed) {
        var assetData = {
          assetTypeName: assetTypeNameVal
        }
        $.ajax({    
          url : `/admin/assets/assetTypes/store`,
          type: 'POST',
          contentType: 'application/json',
          data : JSON.stringify(assetData),
          success: function (data, textStatus, xhr) {
            if(data.status){
              $.fn.appendAssetTypes();
              toastr.success("Added !!!")
            }else{
              toastr.error("Asset category already exists !!")
            }
          },  
        });
      }
    });  
}

/*----------------------------------------------------------------------------*/

//Add asset names for particular asset category/type.
$.fn.addAssetNameFuc = function(){
  Swal.fire({
    html: `<input type="text" id="modelName" class="form-control" placeholder="Brand/Model Name"/>`,
    showCancelButton: true,
    title: 'Add Brand/model',
    confirmButtonText: 'Save',
    confirmButtonColor: '#37a729',
    cancelButtonColor: '#d15858',
    preConfirm: () => {
      var modelName = $("#modelName").val();
      modelNameVal = modelName;
      let assetTypeId=$(`#assetType :selected`).val();
      assetTypeIdVal = assetTypeId;

      if(!assetTypeId){
        Swal.showValidationMessage('Select asset category from dropdown')
      }else if(!modelName){
        Swal.showValidationMessage('Brand/Model name is mandatory.')
      }
    }
  }).then((result) => {
      if (result.isConfirmed) {
        var assetData = {
          assetType: assetTypeIdVal,
          assetName: modelNameVal
        }
        $.ajax({    
          url : `/admin/assets/assetNames/store`,
          type: 'POST',
          contentType: 'application/json',
          data : JSON.stringify(assetData),
          success: function (data, textStatus, xhr) {
            if(data.status){
              $.fn.getAssetNames('assetType','assetName');
              toastr.success("Added !!!")
            }else{
              toastr.error("Brand/Model already exists !!")
            }
          },  
        });
      }
  });  
}

/*-----------------------------------------------------------------------*/

//Edit asset type
$.fn.editAssetTypeFuc = function(){
  let assetTypeId=$(`#assetType :selected`).val();
  let assetTypeText=$(`#assetType :selected`).text();
  if(!assetTypeId || !assetTypeText){
    toastr.error("select asset category")
  }else{
    Swal.fire({
      html: `<input type="text" id="replaceAssetTypeName" class="form-control" value="${assetTypeText}"/>`,
      showCancelButton: true,
      title: 'Edit Asset Category',
      confirmButtonText: 'Save',
      confirmButtonColor: '#37a729',
      cancelButtonColor: '#d15858',
      preConfirm: () => {
        var replaceAssetTypeName = $("#replaceAssetTypeName").val();
        replaceAssetTypeNameVal = replaceAssetTypeName;
        if(!replaceAssetTypeName){
          Swal.showValidationMessage('Enter asset category name')
        }
      }
    }).then((result) => {
        if (result.isConfirmed) {
          var assetData = {
            assetTypeId: assetTypeId,
            replacedAssetTypeName: replaceAssetTypeNameVal
          }
          $.ajax({    
            url : `/admin/assets/assetTypes/edit`,
            type: 'PUT',
            contentType: 'application/json',
            data : JSON.stringify(assetData),
            success: function (data, textStatus, xhr) {
              if(data.status){
                $.fn.appendAssetTypes();
                toastr.success("Asset category has been successfully modified !!!")
              }else{
                toastr.error("Asset category already exists !!")
              }
            },
          });
        }
    });    
  }
}

/*-----------------------------------------------------------------------*/
//Edit asset name
$.fn.editAssetNameFuc = function(){
  let assetTypeId=$(`#assetType :selected`).val();
  let assetNameId=$(`#assetName :selected`).val();
  let assetNameText=$(`#assetName :selected`).text();

  if(!assetNameId || !assetNameText){
    toastr.error("select Brand/Model")
  }else{
    Swal.fire({
      html: `<input type="text" id="replaceAssetName" class="form-control" value="${assetNameText}"/>`,
      showCancelButton: true,
      title: 'Edit Brand/Model',
      confirmButtonText: 'Save',
      confirmButtonColor: '#37a729',
      cancelButtonColor: '#d15858',
      preConfirm: () => {
        var replaceAssetName = $("#replaceAssetName").val();
        replaceAssetNameVal = replaceAssetName;
        if(!replaceAssetName){
          Swal.showValidationMessage('Enter Brand/Model name')
        }
      }
    }).then((result) => {
        if (result.isConfirmed) {
          var assetData = {
            assetTypeId: assetTypeId,
            assetNameId: assetNameId,
            replacedAssetName: replaceAssetNameVal,
          }
          $.ajax({    
            url : `/admin/assets/assetNames/edit`,
            type: 'PUT',
            contentType: 'application/json',
            data : JSON.stringify(assetData),
            success: function (data, textStatus, xhr) {
              if(data.status){
                $.fn.getAssetNames('assetType','assetName');
                toastr.success("Brand/Model has been successfully modified !!!")
              }else{
                toastr.error("Brand/Model already exists !!")
              }
            },
          });
        }
    });    
  }
}

/* ------------------------------------------------------------------------------- */
$.fn.downloadAssetXlsSheet = function(){
  $.ajax({    
    url : `/admin/assets/xls`,
    type: 'GET',
    success: function (data, textStatus, xhr) {
      if(data.status){
        $('#xlsStatus').text("Xls sheet downloaded successfully !!!");
        $('#xlsStatus').css("color", "green");
        window.location.href = `/public/downloadExcel/${data.xlsFileNameAsset}.xlsx`;
      }else{
        $('#xlsStatus').text("Xls sheet is not available !!!");
        $('#xlsStatus').css("color", "red");
      }
    },
  });  
}