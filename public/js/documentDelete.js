function deleteDocumentRecord(e){
  $(".deleteDocument").click(function () {    
    let dataId = $(e).data("id");
    swal({
      title: "Are you sure?",
      text: "You will not be able to recover this data",
      icon: "warning",
      buttons: ["No, cancel it!", "Yes, I am sure!"],
    }).then(function (isConfirm) {
      if (isConfirm) {
        window.location = "/admin/documents/" + dataId + "/delete";
      }
    });
  });
}

function deleteDocumentFile(documentID, property) {
  swal({
    title: "Are you sure?",
    text: "You will not be able to recover this data",
    icon: "warning",
    buttons: ["No, cancel it!", "Yes, I am sure!"],
  }).then(function (isConfirm) {
    if (isConfirm) {
      document.location.href = `/admin/documents/${documentID}/delete-file?doc=${property}`;
    }
  });
}

$("#addOtherDocument").on("click", function () {
  const dName = parseInt(Math.random() * 10000000);
  $(
    ".documentForm"
  ).append(`<div class="item border-bottom py-3" id='${dName}' style="border-bottom: none !important;">
        <div class="row justify-content-md-center">
          <div class="col-sm-2">
            <div class="form-group">
              <input type="text" name="otherDocumentName" required class="form-control" placeholder="Document Name">
            </div>
          </div><!--//col-->
          <div class="col-sm-3">
            <div class="form-group">
              <input type="text" name="otherRemark" class="form-control" placeholder="Remark">
            </div>
          </div><!--//col-->
          <div class="col-sm-4">
            <div class="form-group">
              <div class="col-sm-10 row">
                <div class="col-10">
                  <input type="file" accept="image/*, .bmp, .doc, .pdf" onchange="imagePreview(this,'otherDocument${dName}')" required class="form-control" name="otherDocument" style="overflow: hidden;">
                </div>
                <div class="col-2">
                  <img class="otherDocument" id="otherDocument${dName}" style="display: none;"/>			
                </div>                               
              </div>
            </div>
          </div><!--//col-->
          <div class="col-sm-1">
            <div class="form-group">
            
            <td><a ><button type="button" data-id='${dName}' onclick="deleteDoc(this)"
                class="btn btn-danger" style="border-radius: 50%;">
                <i class="fas fa-times"></i>
              </button></a></td>
              
          </div>
          </div><!--//col-->
        </div><!--//row-->
      </div><!--//item-->`);
});

function deleteDoc(identifier) {
  var element = document.getElementById($(identifier).data("id"));
  element.parentNode.removeChild(element);
}

function selectDocumet(e) {
  var offerLetter = document.getElementById("offerLetterSelect");
  var appointmentLetter = document.getElementById("appointmentLetterSelect");
  var marksheet10 = document.getElementById("10MarksheetSelect");
  var marksheet12 = document.getElementById("12MarksheetSelect");
  var bachelor = document.getElementById("bachelorSelect");
  var master = document.getElementById("masterSelect");
  var IDProof = document.getElementById("IDproofSelect");
  var otherDocument = document.getElementById("otherDocumentSelect");

  offerLetter.style.display = e.selectedIndex == 0 ? "block" : "none";
  appointmentLetter.style.display = e.selectedIndex == 1 ? "block" : "none";
  marksheet10.style.display = e.selectedIndex == 2 ? "block" : "none";
  marksheet12.style.display = e.selectedIndex == 3 ? "block" : "none";
  bachelor.style.display = e.selectedIndex == 4 ? "block" : "none";
  master.style.display = e.selectedIndex == 5 ? "block" : "none";
  IDProof.style.display = e.selectedIndex == 6 ? "block" : "none";
  otherDocument.style.display = e.selectedIndex == 7 ? "block" : "none";

  var offerLetterValue = document.getElementById("offerLetterDocumentSelect")
    .value;
  var appoinmentLetterValue = document.getElementById(
    "appoinmentLetterDocumentSelect"
  ).value;
  var marksheet10Value = document.getElementById("marksheet10DocumentSelect")
    .value;
  var marksheet12Value = document.getElementById("marksheet12DocumentSelect")
    .value;
  var BachelorDocumentValue = document.getElementById(
    "BECertificateDocumentSelect"
  ).value;
  var masterDocumentValue = document.getElementById(
    "mastersCertificateDocumentSelect"
  ).value;
  var IDProofValue = document.getElementById("IDproofDocumentSelect").value;

  if (offerLetterValue) {
    offerLetter.style.display = "block";
  }
  if (appoinmentLetterValue) {
    appointmentLetter.style.display = "block";
  }
  if (marksheet10Value) {
    marksheet10.style.display = "block";
  }
  if (marksheet12Value) {
    marksheet12.style.display = "block";
  }
  if (BachelorDocumentValue) {
    bachelor.style.display = "block";
  }
  if (masterDocumentValue) {
    master.style.display = "block";
  }
  if (IDProofValue) {
    IDProof.style.display = "block";
  }
}

$(document).ready(function(){
  $('#popUpEditDocumentWindow').on('hidden.bs.modal', function () {
    $('#clearDocumentModal').trigger('reset')
    $('#clearDocumentModal').load(document.URL +  ' #clearDocumentModal');
  })
});
