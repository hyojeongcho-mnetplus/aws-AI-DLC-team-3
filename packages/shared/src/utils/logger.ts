export function createLogger(context: string) {
  const log = (level: string, message: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      ...meta,
    }));
  };
  return {
    info: (msg: string, meta?: Record<string, unknown>) => log('INFO', msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log('ERROR', msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => log('WARN', msg, meta),
  };
}
