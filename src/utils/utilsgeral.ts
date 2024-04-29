import axios from 'axios';
import nodemailer from 'nodemailer'
import {config} from '../global.js'
import * as fs from 'fs';
import { promisify } from 'util';
import {dirs} from '../global.js'


const emails:any[] =['giovani.emp@gmail.com','alex@optimalmarketing.io','http://Bezerraraphaelbgmail.com','tondinrafael@gmail.com','data.brainside@gmail.com']

const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

 function formatPhoneNumber2(number: string): string {
    // Remove caracteres não numéricos
    let cleaned = number.replace(/\D+/g, '');
  
    // Verifica se o número começa com '55' (código do Brasil), e remove se necessário
    if (cleaned.startsWith('55')) {
        cleaned = cleaned.substring(2);
    }
  
    return cleaned;
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

   const sendEmail = (messages:any) => {
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

   function limparStringEManterPrimeiraLinha(descricao: string): string {
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
  function extractContactDetails(messageText:any) {
    const emailMatch = messageText.match(/\bemail:\s*([^\s,;]+)/i) || messageText.match(/\b([\w.-]+@[\w.-]+\.\w+)\b/);
  
    const email = emailMatch ? emailMatch[1] : null;
  
    return email;
  }

   async function sendSessionDownEmail(sessionId:string) {
  
  let mailOptions = {
      from: config.email,
      to: emails,
      subject: 'Erro de sessão',
      text: `Chatbot ${sessionId} reiniciado por erro`,
     
  };
  
  transporter.sendMail(mailOptions, (error: any, info: { messageId: any; }) => {
      if (error) {
          return console.log(error);
      }
      console.log('E-mail enviado: %s', info.messageId);
  });
  }

   async function CPF(cpf: string) {
    let config2:any = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://api.cpfcnpj.com.br/${config.cpfToken}/13/${cpf}`,
      headers: { 
        'Content-Type': 'application/json'
      },
    };
  
    try {
      const response = await axios.request(config2);
      return response.data;
    } catch (error) {
      // Aqui você pode tratar o erro como desejar
      // Por exemplo, retornando uma mensagem de erro personalizada
      console.error('Erro ao consultar CPF:', error);
      throw new Error('Falha ao consultar o CPF');
    }
  }

  function formatPhoneNumberGo(phoneNumber: string): string {
    // Remove espaços e hífens do número de telefone
    return phoneNumber.replace(/\s+|-/g, '');
  }

   function delayDb(ms:any) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
   async function query(data: any) {
    let attempts = 0;
    const maxAttempts = 3;
  
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(
          config.flowiseUrl,
          {
            method: "POST",
            headers: {
              "Authorization": config.flowiseKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );
  
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
  
        const result = await response.json();
        return result;
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed: ${error}`);
        attempts += 1;
  
        // Optional: Add a delay between retries
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempts));
        }
      }
    }
  
    return "não foi possível processar a solicitação, tentennovamente mais tarde"
  }

  async function createDirectoryIfNotExists(dirPath: string): Promise<void> {
    try {
        // Tenta acessar o diretório para verificar se ele já existe
        await access(dirPath, fs.constants.F_OK);
        console.log('Diretório já existe:', dirPath);
    } catch (error) {
        // Se o diretório não existir, um erro será lançado e o código abaixo será executado
        console.log('Diretório não encontrado, criando...');
        try {
            // Cria o diretório, incluindo os diretórios pais necessários (similar ao 'mkdir -p')
            await mkdir(dirPath, { recursive: true });
            console.log('Diretório criado:', dirPath);
        } catch (mkdirError) {
            console.error('Erro ao criar o diretório:', mkdirError);
            throw mkdirError;  // Lança o erro para ser tratado por quem chamar a função
        }
    }
}

async function createdirs(){
  for (const dir of dirs){
    await createDirectoryIfNotExists(dir)
  }
}

  export default {query,delayDb, formatPhoneNumberGo, sendSessionDownEmail, extractContactDetails, limparStringEManterPrimeiraLinha, sendEmail, createdirs, CPF}