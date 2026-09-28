#!/usr/bin/env node
require("dotenv").config();
const DB_URI = process.env.DB_URI;
// const DB_PATH = DB_URI.substr(0, DB_URI.lastIndexOf("/")+1);
// const DB_NAME = DB_URI.split("/").pop();

const config = {
  mongodb: {
    url: DB_URI,
    // databaseName: DB_NAME,

    options: {
      useNewUrlParser: true, // removes a deprecation warning when connecting
      useUnifiedTopology: true, // removes a deprecating warning when connecting
    }
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: "migrations",

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "migrations",

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: ".js"
};

// Return the config as a promise
module.exports = config;
