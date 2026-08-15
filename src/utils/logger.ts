export const logger = {
  info: (...args: any[]) => console.log(new Date().toISOString(), '[info]', ...args),
  warn: (...args: any[]) => console.warn(new Date().toISOString(), '[warn]', ...args),
  error: (...args: any[]) => console.error(new Date().toISOString(), '[error]', ...args),
};
