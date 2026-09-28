function readURL(input,selectedId) {
  if (input.files && input.files[0]) {
    extension = (input.files[0].name).substr( ((input.files[0].name).lastIndexOf('.') +1) );      
    if(extension == 'pdf')
    {      
      pdffile=input.files[0];
      pdffile_url=URL.createObjectURL(pdffile);
      $('#'+selectedId).attr('src',pdffile_url);
    }else{     
      var reader = new FileReader();    
        reader.onload = function(e) {
          $('#'+selectedId).attr('src', e.target.result);
        }    
        reader.readAsDataURL(input.files[0]);
        document.getElementById(selectedId).style.display = "block";
    }
  }
}

function imagePreview(e,selectedId){    
  readURL(e,selectedId);
};

function represhFunc(){
  $('.updatedProfilePhoto').load(document.URL +  ' .updatedProfilePhoto');
}
