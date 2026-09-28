function openDesignation(){
  document.location.href =`/admin/create/designation`;
}

function seachDesignation(){
  document.location.href =`/admin/view/designation`;
}

function seachEmployeeDesignation(){
  document.location.href =`/admin/view/designation/employees`;
}
function getDepartment(){
  document.getElementById("selectDeg").options.length = 0;
  let deptId=$('#combo :selected').val();
   $.ajax({    
    url : `/admin/departments/`+ `?department=` + deptId ,
    type:'POST',
    success: function (data, textStatus, xhr) {  
      $.each(data,function(){
        let arr=[],i=0;
        $.each(this,function(name,value){
          arr[i]=value;
          i=(i+1);
        })
        $('#selectDeg').append(`<option value="${arr[0]}">${arr[1]}</option>`);
      })
  },  
});
 }

 function getDesignation(designationID){
  document.getElementById("selectDeg").options.length = 0;
  let deptId=$('#combo :selected').val();
   $.ajax({    
    url : `/admin/designations/`+ `?department=` + deptId+ `&designation=` + designationID ,
    type:'POST',
    success: function (data, textStatus, xhr) {  
      $.each(data.designation,function(){
        let arr=[],i=0;
        $.each(this,function(name,value){
          arr[i]=value;
          i=(i+1);
        })
        if(arr[0]==data.dId){
        $('#selectDeg').append(`<option selected value="${arr[0]}">${arr[1]}</option>`);}else{
          $('#selectDeg').append(`<option value="${arr[0]}">${arr[1]}</option>`);
        }
      })
  },   
});
  
 }
 
 function refreshBankName(){
  $.ajax({    
    url : '/admin/bankdetails',
    type:'GET',
    success: function (data, textStatus, xhr) {  
      $.each(data,function(){
        let arr=[],i=0;
        $.each(this,function(name,value){
          arr[i]=value;
          i=(i+1);
          
        })
        $('.selectBankName').append(`<option data-value="${arr[1]}" value="${arr[0]}"></option>`);
      })
      
  },  
});
}

function getDepartmentRefresh(){
  document.getElementById("combo").options.length = 0;
  document.getElementById("selectDeg").options.length = 0;
  $.ajax({    
    url : '/admin/departmentDesignation',
    type:'GET',
    success: function (data, textStatus, xhr) {  
      $.each(data.department,function(){
        let arr=[],i=0;
        $.each(this,function(name,value){
          arr[i]=value;
          i=(i+1);
        });
        $('#combo').append(`<option value="${arr[1]}">${arr[0]}</option>`);
      })
      $.each(data.designation,function(){
        let arr=[],i=0;
        $.each(this,function(name,value){
          arr[i]=value;
          i=(i+1);
        });
        $('#selectDeg').append(`<option value="${arr[0]}">${arr[1]}</option>`);
      })
      
  },
});
}


