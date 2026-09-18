/**
 * Structured logging.
 *
 * Every API route and upstream client logs through this module so all output
 * is machine-parseable JSON in production, filtered by level, and scoped with
 * per-request fields via `logger.child(...)`.
 *
 * Request ids are attached by each route handler (`logger.child({ requestId,
 * route, ... })`), giving correlatable, single-line records per request.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogFields = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const THRESHOLD: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const isJson = process.env.NODE_ENV === 'production';

function emit(level: LogLevel, message: string, fields: LogFields = {}): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[THRESHOLD]) return;

  const record = {
    level,
    ts: new Date().toISOString(),
    msg: message,
    ...fields,
  };

  if (isJson) {
    const line = JSON.stringify(record);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
    return;
  }

  const { ts, msg, ...rest } = record;
  const suffix = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(`[${ts}] ${level.toUpperCase()} ${msg}${suffix}`);
}

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  /** A logger that always merges the given fields into every record. */
  child(fields: LogFields): Logger;
}

function makeLogger(staticFields: LogFields = {}): Logger {
  const log =
    (level: LogLevel) =>
    (message: string, fields: LogFields = {}): void =>
      emit(level, message, { ...staticFields, ...fields });

  return {
    debug: log('debug'),
    info: log('info'),
    warn: log('warn'),
    error: log('error'),
    child: (fields) => makeLogger({ ...staticFields, ...fields }),
  };
}

export const logger: Logger = makeLogger();
