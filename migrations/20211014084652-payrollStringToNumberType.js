const PAYROLL = require('../models/payroll');
module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    let payrollData = await db.collection("payrolls").find({}).toArray();
    for(let element of payrollData){
      let querys = {
        $set: {}
      };

      //Convert string type salary to number.
      if(element.salary){
        querys.$set.salary = Number(element.salary);
      }else{
        querys.$set.salary = 0;
      }

      //Convert string type stipend to number.
      if(element.stipend){
        querys.$set.stipend = Number(element.stipend);
      }else{
        querys.$set.stipend = 0;
      }

      //Update record
      await db.collection('payrolls').updateOne({ _id: element._id }, querys,{ "upsert": true })
    }
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
