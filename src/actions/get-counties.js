"use server";

import { Client } from "pg";

export async function getCounties(state) {
  // Connect to RDS database
  const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    // console.log("[API] successfully opened database.");

    const countiesData = await client.query(
      `SELECT DISTINCT "County name" 
      FROM temp_data
      WHERE "State Abr." = $1`,
      [state]
    );

    const counties = countiesData.rows.map((row) => row["County name"]);
    return counties;
  } catch {
    // console.error("Error fetching data:", error);
    throw new Error("Error: failed to retrieve data.");
  } finally {
    await client.end();
    // console.log("[API] Closed database connection.");
  }
}
