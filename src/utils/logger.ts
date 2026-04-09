/**
 * 生产安全日志工具
 * 开发环境输出日志，生产环境静默
 */

// 开发环境标记
const isDev = import.meta.env.DEV;

/**
 * 生产安全的日志输出
 * 仅在开发环境输出，生产环境静默
 */
export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
};

export default logger;
