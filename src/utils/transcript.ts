import fs from 'fs'
import dotenv from "dotenv"
import OpenAI from "openai";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { Stream } from 'stream';
import path from 'path';
import {config} from '../global.js'
dotenv.config()

const apiKey = config.openai_key;
const openai = new OpenAI();

function encodeImage(imagePath: string): string {
    const image = fs.readFileSync(`${imagePath}`);
    return Buffer.from(image).toString('base64');
  }
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);


///////////////////audio/////////////////////////////
  async function audio(path1: string, maxRetries: number = 3, delay: number = 1000): Promise<string> {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(path1),
          model: "whisper-1",
        });
        return transcription.text;
      } catch (error) {
        attempts++;
        console.log(`Tentativa ${attempts} falhou. Tentando novamente...`);
        if (attempts >= maxRetries) {
          console.error("Máximo de tentativas atingido. Retornando string vazia.");
          return ""; // Retorna uma string vazia em vez de lançar um erro
        }
        await new Promise(resolve => setTimeout(resolve, delay)); // Aguarda um pouco antes de tentar novamente
      }
    }
    return ""; // Retorna uma string vazia se por algum motivo sair do loop sem sucesso
  }

////////////////////////speech/////////////////////////
  async function speech(phone:string, text:string ) {
    const pathi = `${phone}audio.mp3`
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: `${text}`,
    });
    console.log(pathi);
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(pathi, buffer);
  } 

  //////////////////////images/////////////////////
  async function transcryptImage(imagePath: string): Promise<string> {
    // Obtendo a string base64
    const base64Image: string = encodeImage(imagePath);

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
    };

    const payload = {
        model: "gpt-4-vision-preview",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `Descreva os veiculos das fotos, informe, cor, modelo quantidade de portas. Se a imagem não for de um veiculo, proveavelmente 
                        pode ser uma figurinha. De qualquer fora, descreva o que está na imagem.`
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${base64Image}`
                        }
                    }
                ]
            }
        ],
        max_tokens: 500
    };

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        // Supondo que a resposta contém o texto no local correto; ajuste conforme necessário
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error:', error);
        return "";
    }
}
///////////////////////////estract audio from video////////////////////////////////

// Função para extrair áudio de um vídeo
 async function extractAudioFromVideo(videoFilePath: string, audioOutputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    ffmpeg(videoFilePath)
      .output(audioOutputPath)
      .audioCodec('libmp3lame')
      .on('end', () => {
        console.log(`Áudio extraído e salvo em: ${audioOutputPath}`);
        resolve(true); // Indica sucesso
      })
      .on('error', (err) => {
        console.error(`Erro ao extrair áudio: ${err.message}`);
        resolve(false); // Indica falha mas permite a continuação do código
      })
      .run();
  });
}
//////////////////////////salvar transcript //////////////////////

async function saveTranscription(filename: string, transcription: string | Stream | NodeJS.ArrayBufferView | Iterable<string | NodeJS.ArrayBufferView> | AsyncIterable<string | NodeJS.ArrayBufferView>) {
    const baseDir = 'transcripts';
    const transcriptPath = path.join(baseDir, filename.replace(/^.*[\\\/]/, '')); // Remove caminho do arquivo, mantendo apenas o nome
    try {
        if (!fs.existsSync(baseDir)){
            fs.mkdirSync(baseDir); // Cria o diretório se ele não existir
        }
        await fs.promises.writeFile(transcriptPath, transcription, 'utf8');
        console.log(`Transcrição salva em: ${transcriptPath}`);
    } catch (error) {
        console.error(`Erro ao salvar a transcrição: ${error}`);
    }
  }


  //////////////////read transcript//////////////////

  async function readTranscription(filehash: string) {
    // const transcriptFilename = `${filehash.replace(/[/]/g,'')+from}.txt`;
     try {
         const transcription = await fs.promises.readFile(`transcripts/${filehash}`, 'utf8');
         console.log(`Conteúdo do arquivo ${filehash} lido com sucesso.`);
         return transcription;
     } catch (error) {
         console.error(`Erro ao ler o arquivo ${filehash}: ${error}`);
         return ''; // Retorna uma string vazia em caso de erro
     }
   }
   export default {audio, transcryptImage, saveTranscription, extractAudioFromVideo, readTranscription}