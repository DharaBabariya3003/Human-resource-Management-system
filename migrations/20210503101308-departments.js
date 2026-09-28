module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    
    let departmentArray= ['MD Office','Accounts and  Finances','Web Development','Backend Development','Frontend Development','Fullstack Development','Mobile App Development','Desktop App Development','Data & Business Intelligence Specialists','Testing & QA','Executives','Administrators','Sales & Marketting','DevOps Engineers','Web & Mobile App Designing','Cloud Specialists','Analysts','Project & Product Management'];
    for (let element of departmentArray) {
      let allDepartments = {
        departmentName: element,
        __v: 0,
      };
    await db.collection("departments").insertOne(allDepartments);
    }
    
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};

