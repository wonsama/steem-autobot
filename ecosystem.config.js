const env = require("./custom.config");

module.exports = {
  apps: [
    {
      name: "steem-autobot",
      script: "./src/app.js",
      env,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      cron_restart: "0 * * * *",
    },
  ],
};
