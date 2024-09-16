const colors = require("colors");

function log(prefix, message, color) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(
    `${colors[color](`[${prefix}]`)} ${colors.gray(
      `[${timestamp}]`,
    )} ${message}`,
  );
}

module.exports = log;
