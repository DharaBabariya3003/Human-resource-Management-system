$(document).ready(function () {
  $("#checkConfirmPsw").keyup(function () {
    let password = $("#checkPsw").val();
    let confirmPassword = $("#checkConfirmPsw").val();
    if (password != confirmPassword) {
      $("#passwordError").html("**Password is not matching");
      $("#passwordError").css({ color: "red", "font-weight": "bold" });
      return false;
    } else {
      $("#passwordError").html("");
      return true;
    }
  });

  $("#contactNo").keyup(function () {
    let contactNo = $("#contactNo").val();
    if (contactNo.length != 10) {
      $("#contactNoError").html("**enter valid mobile number.");
      $("#contactNoError").css({ color: "red", "font-weight": "bold" });
    } else {
      $("#contactNoError").html("");
    }
  });

  $("#accountNo").keyup(function () {
    let contactNo = $("#accountNo").val();
    if (contactNo.length != 14) {
      $("#accountNoError").html("**enter 14-digit account number.");
      $("#accountNoError").css({ color: "red", "font-weight": "bold" });
    } else {
      $("#accountNoError").html("");
    }
  });
});

function togglePassword() {
  
  var x = document.getElementById("checkPsw");
  if (x.type === "password") {
    x.type = "text";
  } else {
    x.type = "password";
  }
}
function toggleConfirmPassword() {
  
  var x = document.getElementById("checkConfirmPsw");
  if (x.type === "password") {
    x.type = "text";
  } else {
    x.type = "password";
  }
}

function blockSpecialChar(e){
  var k;
  document.all ? k = e.keyCode : k = e.which;
  return ((k > 64 && k < 91) || (k > 96 && k < 123) || k == 8 || k == 32 || (k >= 48 && k <= 57));
  }

  $('.restrictSpace').on('keypress', function(e) {
    if (e.which == 32){
        return false;
    }
});
function randomPassword(){
  var firstName = document.getElementById("firstName").value;
  var lastName = document.getElementById("lastName").value;
  if(firstName && lastName){
    var middleName = document.getElementById("middleName").value;
    var middle;
    if(middleName){
      middle = middleName[0].toLowerCase();
    }else{
      middle = '$';
    }
    var randomPsw = firstName[0].toUpperCase()+middle+lastName[0].toLowerCase()+'@1234';
    return randomPsw;
    
  }
}
function generatePassword(){
  var randomPsw = randomPassword();
  document.getElementById("checkPsw").value = randomPsw;
}
function generateConfirmPassword(){
  var randomPsw = randomPassword();
  document.getElementById("checkConfirmPsw").value = randomPsw;
}