import dotenv from 'dotenv'
import consoleStamp from "console-stamp";
import { loadConfiguration } from './config/Configuration';
import { Server } from './Server';

consoleStamp(console);
dotenv.config();

console.log("Parsing config...");
const config = loadConfiguration();

console.log("Creating server instance...");
new Server(config);
