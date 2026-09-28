module.exports = {
  async up(db, client) {
    /**
     * Create system roles
     */
    const letterheads = [
      {
        letterheadType: "Experience Letterhead",
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
      },
      {
        letterheadType: "Business Letterhead",
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
      },
    ];
    await db.collection("letterheadTypes").insertMany(letterheads);
  },

  async down(db, client) {
    /**
     * Delete system roles
     */
    await db
      .collection("letterheadTypes")
      .deleteMany([{ letterheadType: "Experience Letterhead" }, { letterheadType: "Business Letterhead" }]);
  },
};
