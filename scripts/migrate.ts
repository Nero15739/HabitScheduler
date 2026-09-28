import { runMigrations, databasePath } from "../src/db";

runMigrations();
console.log(`Migrations applied to ${databasePath()}`);
