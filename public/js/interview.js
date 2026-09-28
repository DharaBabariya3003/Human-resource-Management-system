$(document).ready(function() {
	
  var data = {}; 
  $("#encodings option").each(function(i,el) {  
    data[$(el).data("value")] = $(el).val();
  });
   $('#technicalRoundUserName').change(function(){
    var value = $('#technicalRoundUserName').val();
    var userId = $('#encodings [value="' + value + '"]').data('value');
    if(!userId){
      $('#technicalRoundUser').val("");
      return false;
    }else{
      $('#technicalRoundUser').val(userId);
    }
  });
  $('#technicalRoundUserName').keydown(function(){
    $('#technicalRoundUser').val("");
  });

  // HR users datalist.
  var hrData = {}; 
  $("#hrEncodings option").each(function(i,el) {  
    hrData[$(el).data("value")] = $(el).val();
  });
   $('#hrRoundUserName').change(function(){
    var value = $('#hrRoundUserName').val();
    var hrId = $('#hrEncodings [value="' + value + '"]').data('value');
    if(!hrId){
      $('#hrRoundUser').val("");
      return false;
    }else{
      $('#hrRoundUser').val(hrId);
    }
  });
  $('#hrRoundUserName').keydown(function(){
    $('#hrRoundUser').val("");
  });

  // reference users datalist.
  var referenceData = {}; 
  $("#referenceEncodings option").each(function(i,el) {  
    referenceData[$(el).data("value")] = $(el).val();
  });
   $('#referenceUserName').change(function(){
    var value = $('#referenceUserName').val();
    var referenceUserId = $('#referenceEncodings [value="' + value + '"]').data('value');
    if(!referenceUserId){
      $('#referenceUser').val("");
      return false;
    }else{
      $('#referenceUser').val(referenceUserId);
    }
  });
  $('#referenceUserName').keydown(function(){
    $('#referenceUser').val("");
  });


});
