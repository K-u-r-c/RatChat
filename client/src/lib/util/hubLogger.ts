import {type ILogger, LogLevel} from "@microsoft/signalr";


/** A simple console logger for SignalR that only logs in development mode. */
export class hubLogger implements ILogger {
  log(logLevel: LogLevel, message: string): void {
    if (import.meta.env.DEV) {
      switch (logLevel) {
        case LogLevel.Critical:
        case LogLevel.Error:
          console.error(message);
          break;
        case LogLevel.Warning:
          console.warn(message);
          break;
        case LogLevel.Information:
          console.log(message);
          break;
        case LogLevel.Debug:
          // console.debug(message);
          break;
        case LogLevel.Trace:
          // console.trace(message);
          break;
        case LogLevel.None:
          // No logging
          break;
        default:
          // console.log(message);
          break;
      }
    }
  }
}