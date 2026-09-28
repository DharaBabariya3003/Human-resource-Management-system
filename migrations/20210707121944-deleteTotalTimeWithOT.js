module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    await db.collection('attendances').updateMany({}, {$unset: {totalTimeWithOT: 1,employeeCode: 1,name: 1}});
    await db.collection('leaves').updateMany({}, {$unset: {attendanceCode: 1,fullName: 1}});
    await db.collection('interviews').updateMany({}, {$unset: {interviewDate: 1}});
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
