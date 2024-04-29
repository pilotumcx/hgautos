
import dotenv from "dotenv"
//import { RowDataPacket } from 'mysql2';
import { pool } from '../lib/db.js';

dotenv.config()

export const getContact = async (phoneNumber: string): Promise<any[]> => {
  try {
    const [results] = await pool.query('SELECT * FROM contacts WHERE phone = ?', [phoneNumber]);
    // Forçamos o tipo aqui para RowDataPacket[] que é o esperado de uma consulta SELECT
    return results as any[];
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    throw error; // Propagar o erro
  }
};
async function insertChatAndUpdateMessage(contact_id: number, chat_id: string, sender: string, messageBody: string): Promise<void> {
  try {
    // Verifica se o chat já existe
    const [existingChats]: any = await pool.query(
      'SELECT chat_id FROM chats WHERE chat_id = ?',
      [chat_id]
    );

    if (existingChats.length === 0) {
      console.log(`Inserindo novo chat com ID ${chat_id}.`);
      // Se o chat não existir, insere um novo chat
      await pool.query(
        'INSERT INTO chats (chat_id, contact_id) VALUES (?, ?)',
        [chat_id, contact_id]
      );
    } else {
      console.log(`Chat com ID ${chat_id} já existe. Não é necessário inserir novamente.`);
    }

    // Insere a mensagem na tabela messages
    console.log(`Inserindo mensagem no chat com ID ${chat_id}.`);
    await pool.query(
      'INSERT INTO messages (chat_id, sender, message) VALUES (?, ?, ?)',
      [chat_id, sender, messageBody]
    );

    // Atualiza o last_message_timestamp do chat
    await pool.query(
      'UPDATE chats SET last_message_timestamp = CURRENT_TIMESTAMP WHERE chat_id = ?',
      [chat_id]
    );

    console.log('Mensagem inserida e chat atualizado com sucesso.');
  } catch (error) {
    console.error('Erro ao inserir/atualizar chat e mensagem:', error);
  }
}


export const insertContact = async (userName: string, phone: string, chat_id:string, message:string) => {
  try {
    const [userResult]: any = await pool.execute('INSERT INTO contacts (username, phone, sendemail, attempts) VALUES (?, ?, ?, ?)', [userName, phone, 'pendente', 0]);
    const contactId = userResult.insertId;
    insertChatAndUpdateMessage(contactId, chat_id, userName, message)
    console.log(`Usuário inserido com sucesso. ID: ${contactId}`);
    return contactId
  } catch (error) {
    console.error('Erro ao inserir contato:', error);
  }
};

 export const updateContact = async(username: string | null, phone: string) => {
  // Constrói a parte do comando SQL que atualiza o username apenas se ele não for null
  const usernameUpdatePart = username !== null ? 'username = ?, ' : '';
  
  const updateQuery = `
    UPDATE contacts
    SET ${usernameUpdatePart} sendemail = 'enviado'
    WHERE phone = ?;
  `;
  
  try {
    // Prepara os valores para serem inseridos na query
    // Se o username não for null, inclui ambos username e phone nos valores; caso contrário, inclui apenas phone
    const values = username !== null ? [username, phone] : [phone];
    
    // Executa a query com os valores apropriados
    const result = await pool.query(updateQuery, values);
    
    console.log('Contato atualizado com sucesso:', result);
  } catch (error) {
    console.error('Erro ao atualizar o contato:', error);
  } finally {
    // Não é recomendado fechar o pool após cada query em aplicações reais,
    // pois isso interrompe todas as conexões do pool.
    // pool.end();
  }
}

const updateContactFolowup = async(phone: string, attempt:number) => {
  const result = await pool.query('UPDATE contacts SET attempts = ? WHERE phone = ?', [attempt, phone]);
  console.log(result)
  return result
  }
  
const folowUpMessage1 = `Folow-up 1` 

const folowUpMessage2 = `Folow-up 2
`
const folowUpMessage3 = `Folow-up 3`

const folowupArray:any[] = [folowUpMessage1, folowUpMessage2, folowUpMessage3]

  export async function atualizarStatusRegistros(client:any) {
      try {
        // Calcular a data de dois dias atrás e formatar para o padrão ISO sem milissegundos
        const umDiasAtras = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('.')[0]+"Z";
        const [results]:any = await pool.query('SELECT * FROM contacts WHERE sendemail = ? AND attempts <= ? AND updatedAt > ?', ['pendente', 2, umDiasAtras]);
          for (const result of results){
              await client.sendText(result.phone, folowupArray[result.attempts])
              console.log(folowupArray[result.attempts])
              console.log(result.attempts)
              const attempt = result.attempts+1
              console.log(attempt)
              await updateContactFolowup(result.phone, attempt)
          }
      }catch (error) {
          console.error('Erro ao buscar usuários:', error);
          throw error; // Propagar o erro
        }
      }
      const updateCar = async(contactId:string, car:string) => {
        // Constrói a parte do comando SQL que atualiza o username apenas se ele não for null    
        const updateQuery = `
        UPDATE contacts
        SET carro_interesse = ?
        WHERE contact_id = ?;
        `;
        try {
          // Prepara os valores para serem inseridos na query
          // Se o username não for null, inclui ambos username e phone nos valores; caso contrário, inclui apenas phone
          const values =  [car, contactId] 
          
          // Executa a query com os valores apropriados
          const result = await pool.query(updateQuery, values);
          
          console.log('Contato atualizado com sucesso:', result);
        } catch (error) {
          console.error('Erro ao atualizar o contato:', error);
        } finally {
          // Não é recomendado fechar o pool após cada query em aplicações reais,
          // pois isso interrompe todas as conexões do pool.
          // pool.end();
        }
      }
      const getCar = async (req: any, res: any) => {
        console.log('Corpo da Requisição:', req.body);
        const response:any = req.body
        await updateCar(response.contactId, response.carroInteresse)
        res.status(200).send('Webhook recebido com sucesso!');
      }
    

  export default {atualizarStatusRegistros, updateContact, getContact, insertContact, insertChatAndUpdateMessage, getCar}