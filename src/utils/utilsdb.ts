
import dotenv from "dotenv"
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
        `INSERT INTO chats (chat_id, contact_id, attempts, email, start_timestamp) VALUES (?, ?, ?, ?, CONVERT_TZ(NOW(), @@session.time_zone, 'America/Sao_Paulo'))`,
        [chat_id, contact_id, 0, 'pendente']
      );
    } else {
      console.log(`Chat com ID ${chat_id} já existe. Não é necessário inserir novamente.`);
    }

    // Insere a mensagem na tabela messages
    console.log(`Inserindo mensagem no chat com ID ${chat_id}.`);
    await pool.query(
      `INSERT INTO messages (chat_id, sender, message, timestamp) VALUES (?, ?, ?, CONVERT_TZ(NOW(), @@session.time_zone, 'America/Sao_Paulo'))`,
      [chat_id, sender, messageBody]
    );

    // Atualiza o last_message_timestamp do chat
    console.log(`Atualizando o timestamp da última mensagem do chat com ID ${chat_id}.`);
    await pool.query(
      `UPDATE chats SET last_message_timestamp = CONVERT_TZ(NOW(), @@session.time_zone, 'America/Sao_Paulo') WHERE chat_id = ?`,
      [chat_id]
    );

    console.log('Mensagem inserida e chat atualizado com sucesso.');
  } catch (error) {
    console.error('Erro ao inserir/atualizar chat e mensagem:', error);
  }
}


export const insertContact = async (userName: string, phone: string, chat_id:string, message:string) => {
  try {
    const [userResult]: any = await pool.execute('INSERT INTO contacts (username, phone) VALUES (?, ?)', [userName, phone]);
    const contactId = userResult.insertId;
    await insertChatAndUpdateMessage(contactId, chat_id, userName, message)
    console.log(`Usuário inserido com sucesso. ID: ${contactId}`);
    return contactId
  } catch (error) {
    console.error('Erro ao inserir contato:', error);
  }
};

export const updateChat = async (contact_id: string) => {
  const updateQuery = `
    UPDATE chats
    SET email = 'enviado', last_message_timestamp = CONVERT_TZ(NOW(), @@session.time_zone, 'America/Sao_Paulo')
    WHERE contact_id = ? AND email = 'pendente';
  `;
  try {
    // Executa a query com os valores apropriados
    const [result]: any = await pool.query(updateQuery, [contact_id]);
    
    // Verifica se alguma linha foi afetada
    if (result.affectedRows === 0) {
      console.log('Nenhuma linha foi atualizada.');
      return null;
    }

    console.log('Contato atualizado com sucesso:', result);
    return result;
  } catch (error) {
    console.error('Erro ao atualizar o contato:', error);
    return null;

  } finally {
    // Não é recomendado fechar o pool após cada query em aplicações reais,
    // pois isso interrompe todas as conexões do pool.
    // pool.end();
  }
}

      const updateCar = async(contactId:string, car:string) => {
        // Constrói a parte do comando SQL que atualiza o username apenas se ele não for null    
        const updateQuery = `
        UPDATE chats
        SET car_interest = ?, last_message_timestamp = CONVERT_TZ(NOW(), @@session.time_zone, 'America/Sao_Paulo')
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
    

  export default {updateChat, getContact, insertContact, insertChatAndUpdateMessage, getCar}