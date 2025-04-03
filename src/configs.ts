import dotenv from 'dotenv';

dotenv.config({ path: `.env` });

export const {
  PORT,
  DB_USERNAME,
  DB_PASSWORD,
  DB_HOST,
  DB_DATABASE,
  DB_DIALECT,
  DB_PORT,
  JWT_SECRET,
  MAIL_SERVICE,
  MAIL_USER,
  MAIL_USER_SECRET,
  FRONTEND_LINK,
  OWN_LINK,
} = process.env as { [key: string]: string };
