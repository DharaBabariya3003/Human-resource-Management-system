module.exports = {
  async up(db, client) {
    /**
     * Create system roles
     */
    const AttendanceCodes = {
      index: 0,
      code: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    };

    await db.collection("AttendanceCodes").insertOne(AttendanceCodes);
  },

  async down(db, client) {
    /**
     * Delete system roles
     */
  },
};
