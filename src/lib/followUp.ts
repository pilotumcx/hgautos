import {pool} from './db.js'
import OpenAI from "openai";
import { getSocket } from '../messages/sessionManager.js';
import {redis} from './db.js'
const openai = new OpenAI();

async function getContactsForFollowUp(): Promise<any[]> {
  try {
    const currentTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const query = `
        SELECT chat_id, attempts
        FROM chats
        WHERE last_message_timestamp < DATE_SUB(NOW(), INTERVAL 24 HOUR)
        AND (attempts IS NULL OR attempts < 3)
        AND (email IS NULL OR email <> 'enviado');
    `;
    const [rows]:any = await pool.query(query);
    return rows;
  } catch (error) {
    console.error('Erro ao buscar contatos para follow-up:', error);
    throw error;
  }
}

async function updateFollowUpAttempt(chat_Id: string, attempts:any): Promise<void> {
  let attemptsForm = attempts
  if(!attemptsForm){
    attemptsForm = 0;
  }
  try {
    await pool.query(`
      UPDATE chats
      SET attempts = ?, last_message_timestamp = CONVERT_TZ(NOW(), @@session.time_zone, 'America/Sao_Paulo')
      WHERE chat_id = ?
    `, [attemptsForm+1, chat_Id]);
    console.log(`Tentativa de follow-up atualizada para o contato ${chat_Id}.`);
  } catch (error) {
    console.error('Erro ao atualizar tentativa de follow-up:', error);
    throw error;
  }
} 

async function getConversationHistory(chat_id: string): Promise<string> {
  try {
    const [results]: any = await pool.query(`
      SELECT m.message
      FROM messages m
      JOIN chats c ON m.chat_id = c.chat_id
      WHERE c.chat_id = ?
      ORDER BY m.message_id ASC
    `, [chat_id]);

    const conversationHistory = results.map((row: any) => row.message).join('\n');
    return conversationHistory;
  } catch (error) {
    console.error('Erro ao obter histórico da conversa:', error);
    throw error;
  }
}


async function sendMessage(chat_id: string, message: string, client:any): Promise<void> {
  const updateQuery = `INSERT INTO messages (chat_id, sender, message, timestamp) VALUES (?, ?, ?, CONVERT_TZ(NOW(), @@session.time_zone, 'America/Sao_Paulo') );`;
    try {
      await pool.query(updateQuery, [chat_id, "assistente", message]);
      await client.sendMessage(`${chat_id.replace('chat_','')}`, { text: message });
      console.log(`Mensagem enviada para ${chat_id.replace('chat_','')}: ${message}`);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }


async function addRecordToList(key:string, message:string) {
  const jsonRecord = {
      type: "ai",
      data: {
          content: message,
          tool_calls: [],
          invalid_tool_calls: [],
          additional_kwargs: {},
          response_metadata: {}
      }
  };
  const recordString = JSON.stringify(jsonRecord);
  await redis.lpush(key, recordString);
  console.log('Registro adicionado à lista com sucesso.');
}   

async function generateFollowUpMessage(context: string): Promise<string> {
  try {
     const response =await openai.chat.completions.create({
        messages: [{ role: "system", content: `Como assistente virtual da concessionária HGautos, sua função é criar uma mensagem de follow-up para dar continuidade no atendimento. Não informe o remetente nas respostas, apenas a mensagem para tentar despertar o interesse do cliente novamente. Segue histórico da conversa${context}` }],
        model: "gpt-3.5-turbo",
      });

      if (response.choices && response.choices.length > 0 && response.choices[0].message.content) {
          console.log(response.choices[0].message.content);
          return response.choices[0].message.content;
      } else {
          console.error('Nenhuma resposta válida recebida');
          return '';
      }
     
  } catch (error) {
    console.error('Erro na solicitação:', error);
    return '';
    }
    }
    async function sendFollowUpMessage( attempts:any ,chat_id: string, conversationHistory: string): Promise<void> {
      const sock = getSocket();
      const followUpMessage = await generateFollowUpMessage(conversationHistory);
      await sendMessage(chat_id, followUpMessage, sock);
      await updateFollowUpAttempt(chat_id, attempts);
      await addRecordToList(`${chat_id.replace('chat_','')}`, followUpMessage);
    }

    export async function processFollowUpMessages() {
      const contacts = await getContactsForFollowUp();
    
      if (contacts.length === 0) {
        console.log('Não há contatos para follow-up no momento.');
        return;
      }
    
      for (const contact of contacts) {
        const { chat_id, attempts } = contact;
        const conversationHistory = await getConversationHistory(chat_id);
        await sendFollowUpMessage(attempts, chat_id, conversationHistory);
      }
    }

    export default {getConversationHistory}