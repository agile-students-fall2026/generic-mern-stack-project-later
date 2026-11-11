/**
 * Loads environment variables and starts the HTTP server.
 */

require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Back-end listening on http://localhost:${PORT}`);
  console.log(`Config:  http://localhost:${PORT}/api/config`);
});
