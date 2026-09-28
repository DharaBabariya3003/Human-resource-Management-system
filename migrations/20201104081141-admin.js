module.exports = {
  async up(db, client) {
    /**
     * Create system admin
     */
    const role = await db.collection("roles").findOne({ name: "admin" });
    const user = {
      password: "$2a$10$U.JIz8jtaejqKrJRmpq3NuzsyIHz.WxMLk42o6jLbkqsFa0alP6Fa", // Passowrd is: 12345678
      role: role._id,
      isDeleted: false,
      isLeft: false,
      firstName: "admin",
      email: "admin@gmail.com",
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    };
    await db.collection("users").insertOne(user);
  },

  async down(db, client) {
    /**
     * Delete system admin
     */
    await db.collection("users").deleteOne({ email: "admin@gmail.com" });
  },
};
