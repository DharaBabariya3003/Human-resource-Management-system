document.addEventListener("DOMContentLoaded", function (event) {
  if ($("#interviewStatusNo").is(":checked")) {
    toggleDiv("interviewStatusNo");
  }
});

$("input[name=interviewStatus]").click(function () {
  toggleDiv(this.id);
});

function toggleDiv(id) {
  if (id == "interviewStatusNo") {
    $(".interviewStatusDetails").hide("slow");
  } else {
    $(".interviewStatusDetails").show("slow");
  }
}

$(document).ready(function () {
  $("#communicationSkill").blur(function () {
    if ($("#communicationSkill").val() > 10) {
      $("#communicationSkill").val("");
    }
  });

  $("#confidenceOrBodyLang").blur(function () {
    if ($("#confidenceOrBodyLang").val() > 10) {
      $("#confidenceOrBodyLang").val("");
    }
  });

  $("#logicalSkills").blur(function () {
    if ($("#logicalSkills").val() > 10) {
      $("#logicalSkills").val("");
    }
  });
});

function getLocalTime(dateAndTime) {
  let localTime = moment.utc(dateAndTime).local().format(); 
  let localHours = new Date(localTime).getHours();
  let localMinutes = new Date(localTime).getMinutes();
  let localH = format_two_digits(localHours); 
  let localM = format_two_digits(localMinutes);
              
  let localHnM = localH+":"+localM ;	
  return localHnM ;
}
function format_two_digits(n) {
  return n < 10 ? '0' + n : n;
}

