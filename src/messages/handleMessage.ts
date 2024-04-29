import utils from "./messageUtils.js";

const messageBuffer: Record<string, string[]> = {};
const messageTimers: Record<string, NodeJS.Timeout> = {};
const bufferTime = 20000; // 20 


async function handleMessage(client: any, message: any): Promise<boolean> {
    try {
      const input = await utils.processMessage(message);;
      if (!messageBuffer[message.key.remoteJid]) {
        messageBuffer[message.key.remoteJid] = [];
    } 
    // Adicionar a mensagem atual ao buffer
    messageBuffer[message.key.remoteJid].push(input);
  
    // Reiniciar o timer para o contato
    if (messageTimers[message.key.remoteJid]) {
        clearTimeout(messageTimers[message.key.remoteJid]);
    }
    await new Promise<void>((resolve, reject) => {
      messageTimers[message.key.remoteJid] = setTimeout(async () => {
        try {
      const fullMessage = messageBuffer[message.key.remoteJid].join(' ');
      delete messageBuffer[message.key.remoteJid];
      delete messageTimers[message.key.remoteJid];
      console.log(fullMessage)
      await utils.processFullMessage(client, fullMessage, message);
                     resolve();          
                    } catch (error) {
                      reject(error); // Rejeita a promessa se ocorrer um erro
                    }
                  }, bufferTime);
                });
            
                return true; // Retorna true se tudo ocorrer bem
              } catch (error) {
                console.error('Erro ao processar mensagem:', error);
                return false; // Retorna false em caso de erro
              }
            }

export default {handleMessage}
