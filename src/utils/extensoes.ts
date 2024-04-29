import * as path from 'path';
import * as fs from 'fs/promises'; // Utilize fs.promises para métodos assíncronos
import * as mime from 'mime-types';
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import transcritores from './transcript.js'
import { dirs } from '../global.js';


// Função auxiliar para salvar arquivo de mídia
export async function saveMediaFile(buffer: Buffer, fileName: string): Promise<string> {
    const filePath = path.join(fileName);
    await fs.writeFile(filePath, buffer);
    return filePath;
}

// Função para processar vídeo
async function processVideo(message: any): Promise<string> {
  const buffer:any = await downloadMediaMessage(message, 'buffer', { });
  //const videoFileName = `video/${Buffer.from(message.message.videoMessage.fileSha256).toString('base64').replace(/\//g, '') + message.key.remoteJid}.${mime.extension(message.message.videoMessage.mimetype)}`;
  const transcript = `${message.key.id}`
  const videoFileName = `${dirs[0]}/${message.key.id}.${mime.extension(message.message.videoMessage.mimetype)}`;
  const videoFilePath = await saveMediaFile(buffer, videoFileName);
  const audioPath = `${dirs[1]}/${message.key.id}.mp3`;
  const audioExtracted = await transcritores.extractAudioFromVideo(videoFilePath, audioPath);
  if (!audioExtracted) {
      console.log("Este vídeo não contém áudio ou o áudio não pôde ser extraído.");
      // Retorne ou manipule o erro conforme necessário
      return "audio não processado";
  } else {
      const transcription = await transcritores.audio(audioPath);
      if (transcription.trim() === '') {
        return "O áudio extraído não pôde ser transcrevido. Responda de acordo com o contexto da conversa.";
        
      } else {
        await transcritores.saveTranscription(transcript.replace(/^.*[\\\/]/, '') + '.txt', transcription); // Salva a transcrição do áudio extraído do vídeo
        return transcription
      }
    }
}
// Função para processar imagem
async function processImage(message: any): Promise<string> {
const buffer:any = await downloadMediaMessage(message, 'buffer', { });
//const imageFileName = `images/${Buffer.from(message.message.imageMessage.directPath).toString('base64').replace(/\//g, '') + message.key.remoteJid}.${mime.extension(message.message.imageMessage.mimetype)}`;
const transcript = `${message.key.id}`
const imageFileName = `${dirs[2]}/${message.key.id}.${mime.extension(message.message.imageMessage.mimetype)}`;
const imageFilePath = await saveMediaFile(buffer, imageFileName);
const imgTranscription = await transcritores.transcryptImage(imageFilePath);
await transcritores.saveTranscription(transcript.replace(/^.*[\\\/]/, '') + '.txt', imgTranscription); // Salva a transcrição da imagem
return `Tente encontrar os produtos mais similares a descrição a seguir:${imgTranscription}`;
}

// Função para processar áudio
async function processAudio(message: any): Promise<string> {
const buffer:any = await downloadMediaMessage(message, 'buffer', { });
//const audioFileName = `audio/${Buffer.from(message.message.audioMessage.fileSha256).toString('base64').replace(/\//g, '') + message.key.remoteJid}.${mime.extension(message.message.audioMessage.mimetype)}`
const transcript = `${message.key.id}`
const audioFileName = `${dirs[1]}/${message.key.id}.${mime.extension(message.message.audioMessage.mimetype)}`;  
await saveMediaFile(buffer, audioFileName);
  const audioTranscription = await transcritores.audio(audioFileName);
  await transcritores.saveTranscription(transcript.replace(/^.*[\\\/]/, '') + '.txt', audioTranscription)
  console.log(audioTranscription)
  return audioTranscription;
}

// Função para processar texto
async function processText(message: any): Promise<string> {
if (message.message?.extendedTextMessage?.text) {
  return message.message.extendedTextMessage.text;
} else if (message.message?.conversation) {
  return message.message.conversation;
}
return ''
}

async function quoted(contextInfo: any, primaryMessage: any) {
let response = primaryMessage; // Inicia com a mensagem principal
let quotedText = '';
const quotedMessage = contextInfo.quotedMessage;
const adTitle = contextInfo.externalAdReply?.title;
if (adTitle) {
    response = `mensagem atual: ${primaryMessage} \n Título do Anúncio: ${adTitle}`;
    console.log(response);
    return response.trim();
} else 
  if (quotedMessage?.conversation) {
    quotedText = quotedMessage.conversation;
    response = `mensagem atual ${primaryMessage} \n mensagem recuperada: ${quotedText}  `;
  } else 
  // Se quotedText não estiver vazio, concatena com a mensagem principal
  if  (quotedMessage?.extendedTextMessage) {
    quotedText = quotedMessage.extendedTextMessage.text;
    response = `mensagem atual ${primaryMessage} \n mensagem recuperada: ${quotedText}  `;
} else {
  // Identifica o tipo da mensagem citada
    let id = contextInfo.stanzaId;
    id = `${id}.txt`;
    console.log(id)
    const transcriptFilePath = path.join(id);

    try {
      const transcription = await transcritores.readTranscription(transcriptFilePath);
      response = `mensagem atual ${primaryMessage} \n mensagem recuperada: ${transcription}  `;
    } catch (error) {
      console.error(error);
      response += " Não foi possível recuperar a transcrição da mídia citada.";
    }
    // Caso fileSha256 não esteja disponível
    console.log("fileSha256 não está disponível para a mensagem citada.");
  }
  console.log(response.trim())
  return response.trim();
}


 

export default {processText, processAudio, processImage, processVideo, quoted}
