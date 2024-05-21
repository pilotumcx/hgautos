import {makeWASocket,
    DisconnectReason, fetchLatestBaileysVersion, getAggregateVotesInPollMessage,
    makeCacheableSignalKeyStore, isJidBroadcast
  } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import utils from './handleMessage.js';
import emailDown from './messageUtils.js'
let clientGlobal:any
import logger from '../models/logs.js';
import useSequelizeDBAuthStore from '../controllers/useSequelizeDBAuthStore.js'
import NodeCache from 'node-cache'

export async function startWhatsAppSocket() {
    try{
    const { state, saveCreds } = await useSequelizeDBAuthStore(`hgSessison`);
    const { version, isLatest } = await fetchLatestBaileysVersion()
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)
    const msgRetryCounterCache = new NodeCache()
    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: true,
      auth: {
          creds: state.creds,
          /** caching makes the store faster to send/recv messages */
          keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      msgRetryCounterCache,
      generateHighQualityLinkPreview: true,
      // ignore all broadcast messages -- to receive the same
      // comment the line below out
      shouldIgnoreJid: jid => isJidBroadcast(jid),
      // implement to handle retries & poll updates
  })
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                // Check if lastDisconnect is not undefined before accessing its properties
                if (lastDisconnect && 'error' in lastDisconnect && lastDisconnect.error) {
                    const boomError = lastDisconnect.error as Boom & { output: { statusCode: number } };
                    const shouldReconnect = boomError.output.statusCode !== DisconnectReason.loggedOut;
                    console.log('connection closed due to ', boomError, ', reconnecting ', shouldReconnect);
                    // reconnect if not logged out
                    if (shouldReconnect) {
                        await emailDown.sendSessionDownEmail('hg')
                        startWhatsAppSocket();
                    }
                }
            } else if (connection === 'open') {
                console.log('opened connection');
            }
        });

        // Change to async arrow function to use await inside
        sock.ev.on('messages.upsert', async ({ messages }) => {
            if (messages.length === 0) {
                console.log("Nenhuma mensagem recebida no evento 'upsert'.");
                return;
            }
        
            const message: any = messages[0];
            console.log(JSON.stringify(message, undefined, 2));
        
            // Verificar se a mensagem não foi enviada pelo próprio bot
            if (!message.key.fromMe && !message.key.remoteJid.includes('g.us') && !message.key.remoteJid.includes('@broadcast')) {
                console.log('Respondendo a', message.key.remoteJid);
        
                // Verificar se a mensagem contém 'Message absent from node' no 'messageStubParameters'
                if (message.messageStubType === 2 && message.messageStubParameters?.includes("Message absent from node")) {
                    console.log("Mensagem não processada: 'Message absent from node'.");
                    return;
                }
        
                // Verificar se a mensagem contém 'protocolMessage'
                if (message.message?.protocolMessage) {
                    console.log("Mensagem não processada: contém 'protocolMessage'.");
                    return;
                }
        
                // Processar a mensagem normalmente se não for do tipo ignorado
                await utils.handleMessage(sock, message);
            }
        });
        // Remember to save credentials when updated
        sock.ev.on('creds.update', saveCreds);
        clientGlobal = sock;

    } catch (error) {
        console.error('Failed to start WhatsApp socket:', error);
    }
}

export function getSocket() {
    return clientGlobal;
  }
