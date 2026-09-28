module.exports = {
  async up(db, client) {
    /**
     * Create system roles
     */
    const role = 
      {
        name: "HR",
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
      };
    await db.collection("roles").insertOne(role);
  },

  async down(db, client) {
    /**
     * Delete system roles
     */
    await db.collection("roles").deleteOne({ name: "HR" });
  },
};
