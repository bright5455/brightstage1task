import { DataSource } from 'typeorm';
import { Profile } from './profiles/entity/profile.entity';
import * as dotenv from 'dotenv';
dotenv.config();
if (!process.env.DATABASE_URL) {
  dotenv.config();
}
console.log('Connecting to:', process.env.DATABASE_URL);
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Profile],
  synchronize: true,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});