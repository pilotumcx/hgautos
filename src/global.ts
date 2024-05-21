import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from "dotenv"

dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..')
const videoDIr = path.join(projectRoot, 'video');
const audioDIr = path.join(projectRoot, 'audio');
const imagesDIr = path.join(projectRoot, 'images');
const transcriptsDIr = path.join(projectRoot, 'transcripts');
const envpath = path.join(projectRoot, '.env');
const docsDIr = path.join(projectRoot, 'documents');
const stickersDIr = path.join(projectRoot, 'stickers');

export let dirs = [videoDIr, audioDIr, imagesDIr, transcriptsDIr, docsDIr, stickersDIr]


export interface obj {
    name: string,
    phone: string,
    contactId: string | undefined;
    conversationId: string;
}


export const config = {
    cpfToken: process.env.CPF_token || "flow" ,
    flowiseUrl:process.env.flowise_url || "flow",
    flowiseKey: process.env.flowise_key || "flow",
    openai_key:process.env.OPENAI_API_KEY,
    ENV_PATH: envpath || './.env',
    email_host: process.env.email_host || "flow" ,
    email: process.env.email || "flow",
    email_password: process.env.email_password || "flow"
    }

    