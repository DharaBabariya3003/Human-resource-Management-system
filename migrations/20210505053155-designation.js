module.exports = {
  async up(db, client) {
    let departmentArray= ['MD Office','Accounts and  Finances','Web Development','Backend Development','Frontend Development','Fullstack Development','Mobile App Development','Desktop App Development','Data & Business Intelligence Specialists','Testing & QA','Executives','Administrators','Sales & Marketting','DevOps Engineers','Web & Mobile App Designing','Cloud Specialists','Analysts','Project & Product Management'];
    let designationArray=[];
    for (let deptElement of departmentArray) {
       let departmentID = await db.collection("departments").findOne({ departmentName: deptElement },'_id');
       if(deptElement==='MD Office'){
        designationArray= ['Owner'];
       }else if(deptElement==='Accounts and  Finances'){
        designationArray= ['Accounting Manager','Accounting Supervisor','Senior Accountant','Staff Accountant','Junior Accountant'];
       }else if(deptElement==='Web Development'){
        designationArray= ['Website Builders','CMS Developers'];
       }else if(deptElement==='Backend Development'){
        designationArray= ['Node.js - JavaScript Developer','Python Developer','Java Developer','PHP Developer','C# | .NET Developer','Ruby Developer','Perl Developer'];
       }else if(deptElement==='Frontend Development'){
        designationArray= ['JavaScript Developer'];
       }else if(deptElement==='Mobile App Development'){
        designationArray= ['iOS App Developer','Android App Developer','Flutter - Cross Platform Mobile App Developer','C# Xamarin - Cross Platform Mobile App Developer','React Native - Cross Platform Mobile App Developer','Ionic - Cross Platform Mobile App Developer','Titanium Appcelerator - Cross Platform Mobile App Developer'];
       }else if(deptElement==='Desktop App Development'){
        designationArray= ['Application Developer','Java/JSE Developer'];
       }else if(deptElement==='Data & Business Intelligence Specialists'){
        designationArray= ['Database Developer','Database Administrator','Data Warehouse (ETL) Developer','BI Analyst','BI Architect','Data Analyst','Data Scientist','Oracle Developer','Power BI Developer','Business Intelligence Consultant'];
       }else if(deptElement==='Testing & QA'){
        designationArray= ['QA Engineer','QA Manager','Test Automation Engineer','Automation Tester','Senior Software QA Engineer','Quality Assurance Engineer'];
       }else if(deptElement==='Executives'){
        designationArray= ['CTO','CIO','IT Director','HR Executive'];
       }else if(deptElement==='Administrators'){
        designationArray= ['System Administrator','Windows Administrator','Linux Administrator','Network Administrator','Database Administrator'];
       }else if(deptElement==='Sales & Marketting'){
        designationArray= ['Sales Representative','Sales Executive','Sales Consultant','Sales Associate','Direct Salesperson','Business Development Manager','Sales Engineer','Technical Manager','Relationship Manager','Client Relationship Manager','Account Manager','Chief Sales Officer','Service Desk Operator'];
       }else if(deptElement==='DevOps Engineers'){
        designationArray= ['DevOps Evangelist','Release Manager','Automation Expert','Software Developer/ Tester','Quality Assurance','Security Engineer','Product Manager','Data Analyst'];
       }else if(deptElement==='Web & Mobile App Designing'){
        designationArray= ['UX/UI Designer','Creative Director','User Researcher','Visual Designer','Web Designer'];
       }else if(deptElement==='Cloud Specialists'){
        designationArray= ['Cloud Systems Engineer'];
       }else if(deptElement==='Analysts'){
        designationArray= ['Business Analyst','System Analyst','Data Warehouse Analyst','Data Analyst'];
       }else if(deptElement==='Project & Product Management'){
        designationArray= ['Product Manager','Project Manager','Technical Lead','VP of Engineering','Development Lead','IT Project Manager','Scrum Teams - Product Owner','Scrum Teams - Scrum Master'];
       }

       
       
      for (let element of designationArray) {
        let designation = {
          departmentId: departmentID._id,
          designationName:element,
          createdAt: new Date(),
          updatedAt: new Date(),
          __v: 0,
        };
        await db.collection("designations").insertOne(designation);
      }


    }
   
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};

