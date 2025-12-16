import morgan from "morgan";
import chalk from "chalk";

export const logger = morgan((tokens, req, res) => {
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const status = tokens.status(req, res);

  // skip morgan log for css
  if (url.match(/\.(css|js|png|jpg|jpeg|gif|svg)$/)) {
    return null;
  }

  // Color HTTP method
  let coloredMethod;
  switch (method) {
    case "GET":
      coloredMethod = chalk.blue(method);
      break;
    case "POST":
      coloredMethod = chalk.green(method);
      break;
    case "PUT":
      coloredMethod = chalk.yellow(method);
      break;
    case "DELETE":
      coloredMethod = chalk.red(method);
      break;
    case "PATCH":
      coloredMethod = chalk.magenta(method);
      break;
    default:
      coloredMethod = chalk.white(method);
  }

  // Color status code
  let coloredStatus;
  if (status >= 500) coloredStatus = chalk.red(status);
  else if (status >= 400) coloredStatus = chalk.yellow(status);
  else if (status >= 300) coloredStatus = chalk.cyan(status);
  else coloredStatus = chalk.green(status);

  return `${coloredMethod} ${url} ${coloredStatus}`;
});