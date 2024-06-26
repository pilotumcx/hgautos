import { YoutubeTranscript } from 'youtube-transcript';
import axios from 'axios';
import OpenAI from "openai";
import moment from 'moment-timezone'
import nodemailer from 'nodemailer';
import extensoes from '../utils/extensoes.js'
import dbFunctions from '../utils/utilsdb.js'
import {config} from '../global.js'
import utilsgeral from '../utils/utilsgeral.js';
import {summary} from '../lib/summary.js';

function delay(ms: number | undefined) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const emails:any[] =['giovani.emp@gmail.com','alex@optimalmarketing.io','http://Bezerraraphaelbgmail.com','tondinrafael@gmail.com','data.brainside@gmail.com']

export function delayDb(ms:any) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatPhoneNumber2(number: string): string {
  // Remove caracteres não numéricos
  let cleaned = number.replace(/\D+/g, '');

  // Verifica se o número começa com '55' (código do Brasil), e remove se necessário
  if (cleaned.startsWith('55')) {
      cleaned = cleaned.substring(2);
  }

  return cleaned + '@c.us';
}


export const sendEmail = (messages:any) => {
  
  let mailOptions = {
      from: config.email,
      to: '507524b963da@mail.revendamais.com.br',
      subject: 'agendamento cliente',
      text: `${messages}`,
     
  };
  
  transporter.sendMail(mailOptions, (error: any, info: { messageId: any; }) => {
      if (error) {
          return console.log(error);
      }
      console.log('E-mail enviado: %s', info.messageId);
  });
};



export async function youtubeTranscript(url: string) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    // Concatena os textos da transcrição em uma única string
    const textos = transcript.map(text => text.text).join(' ');
    console.log(textos); // Exibe a transcrição concatenada
    return textos; // Retorna a transcrição concatenada
  } catch (error) {
    console.error('Erro ao obter transcrição:', error);
    return 'Não foi possível obter a transcrição do vídeo.'; // Retorna uma mensagem de erro padrão
  }
}

export function isBusinessHours() {
  // Define o fuso horário desejado
  const timezone = 'America/Sao_Paulo'; // Substitua pelo seu fuso horário

  // Obtém a hora local atual no fuso horário especificado
  const localNow = moment().tz(timezone);
  const hour = localNow.hour(); // Usa .hour() para obter a hora
  
  // Define o horário comercial de 8h a 18h
  return hour >= 8 && hour < 23;
}


export function limparStringEManterPrimeiraLinha(descricao: string): string {
  // Divide a descrição em linhas
  const linhas = descricao.split('\n');
  // Retorna a primeira linha não vazia
  for (const linha of linhas) {
    if (linha.trim()) { // Verifica se a linha não está vazia
      return linha.trim();
    }
  }
  return ""; // Retorna uma string vazia se todas as linhas forem vazias
}


let transporter = nodemailer.createTransport({
  host: config.email_host,
  port: 465,
  secure: true,
  auth: {
      user: config.email,
      pass: config.email_password
  }
});
 

export async function sendSessionDownEmail(sessionId:string) {
 
let mailOptions = {
    from: config.email,
    to: emails,
    subject: 'erro na sessão',
    text: `Chatbot ${sessionId} reiniciado por erro`,
   
};

transporter.sendMail(mailOptions, (error: any, info: { messageId: any; }) => {
    if (error) {
        return console.log(error);
    }
    console.log('E-mail enviado: %s', info.messageId);
});
}
async function processMessage(message: any) {
  let input = '';
  const messageType = Object.keys(message.message)[0]; // Identifica o tipo de mensagem principal

  switch (messageType) {
      case 'videoMessage':
          input = await extensoes.processVideo(message);
          break;
      case 'imageMessage':
          input = await extensoes.processImage(message);
          break;
      case 'audioMessage':
          input = await extensoes.processAudio(message);
          break;
     case 'extendedTextMessage':
          input = await extensoes.processText(message);
          break;
     case 'conversation':
            input = await extensoes.processText(message);
            break;
            case 'documentMessage':
              input = await extensoes.processDocument(message);
              break;
            case 'stickerMessage':
              input = await extensoes.processSticker(message);
              break;
            case 'contactMessage':
              input = await extensoes.processContact(message);
              break;
      default:
          console.log('Tipo de mensagem não suportado.');
          input = 'responda com a mensagem de boas vindas';
  }

  // Verifica se existe uma quotedMessage, independentemente do tipo da mensagem principal
  const contextInfo = message.message[messageType]?.contextInfo;
  if (contextInfo?.quotedMessage || contextInfo?.externalAdReply) {
      const quotedMessage = contextInfo;
      // Passa o objeto completo da quotedMessage, a mensagem original e o input como primaryMessage
      input += " " + await extensoes.quoted(quotedMessage, input);
  }
  return input
}

function extractContactDetails(messageText:any) {
  const emailMatch = messageText.match(/\bemail:\s*([^\s,;]+)/i) || messageText.match(/\b([\w.-]+@[\w.-]+\.\w+)\b/);

  const email = emailMatch ? emailMatch[1] : null;

  return email;
}
async function processFullMessage(client: any, fullMessage: string, message:any) {
 // const email: string | null | undefined = extractContactDetails(fullMessage);
 let apiResponse 
   let contact = await dbFunctions.getContact(message.key.remoteJid) || [];
   if (contact.length === 0) {
      await dbFunctions.insertContact(message.pushName, message.key.remoteJid, `chat_${message.key.remoteJid}`, fullMessage );
      await delayDb(2000)
      contact = await dbFunctions.getContact(message.key.remoteJid);
      apiResponse = await utilsgeral.query({
      "question": fullMessage,
      "overrideConfig": {
          "sessionId": message.key.remoteJid,
          "vars": {
           "contactId":contact[0].contact_id 
       },
      }
  })
     await dbFunctions.insertChatAndUpdateMessage(contact[0].contact_id,`chat_${message.key.remoteJid}`, 'assistente', apiResponse.text)
   } else if(contact.length > 0){
    console.log(contact[0].contact_id)
     apiResponse = await utilsgeral.query({
      "question": fullMessage,
      "overrideConfig": {
          "sessionId": message.key.remoteJid,
          "vars": {
           "contactId":contact[0].contact_id 
       },
      }
  })
   await  dbFunctions.insertChatAndUpdateMessage(contact[0].contact_id,`chat_${message.key.remoteJid}`,message.pushName, fullMessage)
   await  dbFunctions.insertChatAndUpdateMessage(contact[0].contact_id,`chat_${message.key.remoteJid}`,'assistente', apiResponse.text) 
 }                                

 const textoResposta = apiResponse.text.toLowerCase()
 console.log("Texto da resposta: ", textoResposta);
 console.log(contact[0].contact_id)
 if (textoResposta.includes('rua caraipé das águas')) {
   console.log("Enviando localização...");
   await client.sendMessage(message.key.remoteJid, {text: apiResponse.text});
   await client.sendMessage(message.key.remoteJid, { location: { degreesLatitude: -23.497021, degreesLongitude: -46.41666, name:'HG autos'} })
 } else if (textoResposta.includes('contato direto') || textoResposta.includes('contato diretamente')) {
   console.log("Processando contato direto/diretamente...");
  await client.sendMessage('5511976615204@s.whatsapp.net', `contato ${message.key.remoteJid} interessado em compra a vista`);
  const splitMessages = apiResponse.text.split(/(?<=[.?!])\s+/);

  for (const messageText of splitMessages) {
    const formattedMessageText = messageText.trim();

    const finalPunctuation = /[.]$/;
    const formattedMessageTextWithoutPunctuation = formattedMessageText.replace(finalPunctuation, '');

    await client.sendMessage(message.key.remoteJid, { text: formattedMessageTextWithoutPunctuation.replace(/\]\(/g, ': ').replace(/\[|\]|\(|\)/g, '').replace(/\*\(/g,"") });

    const delayTime = utilsgeral.getDelayTime(formattedMessageTextWithoutPunctuation);
    await new Promise((resolve) => setTimeout(resolve, delayTime));
  }
 } else if (textoResposta.includes('confirmar o agendamento') || textoResposta.includes('agendamento feito') || textoResposta.includes('atendente entrará') ) {
   console.log("Confirmando agendamento...");
   const splitMessages = apiResponse.text.split(/(?<=[.?!])\s+/);

              for (const messageText of splitMessages) {
                const formattedMessageText = messageText.trim();
          
                const finalPunctuation = /[.]$/;
                const formattedMessageTextWithoutPunctuation = formattedMessageText.replace(finalPunctuation, '');
          
                await client.sendMessage(message.key.remoteJid, { text: formattedMessageTextWithoutPunctuation.replace(/\]\(/g, ': ').replace(/\[|\]|\(|\)/g, '').replace(/\*\(/g,"") });
          
                const delayTime = utilsgeral.getDelayTime(formattedMessageTextWithoutPunctuation);
                await new Promise((resolve) => setTimeout(resolve, delayTime));
              }
                  try {
                    const res =  await dbFunctions.updateChat(contact[0].contact_id)
                    if(res){
                    await summary(`chat_${message.key.remoteJid}`)
                  }
                   } catch (error) {
                     console.error(`Erro ao processar mensagens:`, error);
                 }
                 
               } else {           
              // await speech(message.key.remoteJid, apiResponse.text)
              const splitMessages = apiResponse.text.split(/(?<=[.?!])\s+/);

              for (const messageText of splitMessages) {
                const formattedMessageText = messageText.trim();
          
                const finalPunctuation = /[.]$/;
                const formattedMessageTextWithoutPunctuation = formattedMessageText.replace(finalPunctuation, '');
          
                await client.sendMessage(message.key.remoteJid, { text: formattedMessageTextWithoutPunctuation.replace(/\]\(/g, ': ').replace(/\[|\]|\(|\)/g, '').replace(/\*\(/g,"")});
          
                const delayTime = utilsgeral.getDelayTime(formattedMessageTextWithoutPunctuation);
                await new Promise((resolve) => setTimeout(resolve, delayTime));
              }
   
}
}

export default {processFullMessage, processMessage, sendSessionDownEmail }


