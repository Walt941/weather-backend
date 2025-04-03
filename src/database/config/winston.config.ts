import winston, { format } from "winston";
import dotenv from "dotenv";

const { combine, splat, timestamp, printf } = format;

dotenv.config();

const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message} `;
  if (metadata) {
    msg += JSON.stringify(metadata);
  }
  return msg;
});

const winstonConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    format.colorize(),
    splat(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    myFormat
  ),
  transports: [
    new winston.transports.Console(), 
    new winston.transports.File({ 
      filename: 'logs/application.log', 
      level: 'error' 
    })
  ],
};


export const logger = winston.createLogger(winstonConfig);