// hash-passwords.js — run once: node hash-passwords.js
const bcrypt = require("bcrypt");
const { sql, poolPromise } = require("./db");

async function hashTable(table, idField) {
  const pool = await poolPromise;
  const rows = (await pool.request().query(
    `SELECT ${idField} AS id, Password FROM ${table}`
  )).recordset;
  for (const row of rows) {
    if (row.Password && !row.Password.startsWith("$2b$")) {
      const hash = await bcrypt.hash(row.Password, 10);
      await pool.request()
        .input("id", sql.Int, row.id)
        .input("hash", sql.VarChar, hash)
        .query(`UPDATE ${table} SET Password = @hash WHERE ${idField} = @id`);
    }
  }
  console.log(table, "done");
}

(async () => {
  await hashTable("Admin", "Admin_id");
  await hashTable("Teacher", "Teacher_id");
  await hashTable("Student", "Student_id");
  process.exit(0);
})();
