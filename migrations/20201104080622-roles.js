module.exports = {
  async up(db, client) {
    /**
     * Create system roles
     */
    const roles = [
      {
        name: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
      },
      {
        name: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
      },
    ];
    await db.collection("roles").insertMany(roles);
  },

  async down(db, client) {
    /**
     * Delete system roles
     */
    await db
      .collection("roles")
      .deleteMany([{ name: "admin" }, { name: "user" }]);
  },
};
