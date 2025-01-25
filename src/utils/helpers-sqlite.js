export function jsonResponse(message_dict, status = 200) {
  return new Response(JSON.stringify(message_dict), {
    status: status,
    headers: { "Content-Type": "application/json" },
  });
}

// Utility function for running SQL queries (single or multiple row)
export function runQuery(db, query, params = [], singleRow = false) {
  return new Promise((resolve, reject) => {
    const callback = (err, result) => {
      if (err) return reject(err);
      resolve(result);
    };

    if (singleRow) {
      db.get(query, params, callback); // Use db.get for a single row
    } else {
      db.all(query, params, callback); // Use db.all for multiple rows
    }
  });
}
