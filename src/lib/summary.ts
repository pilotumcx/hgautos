import utils from '../utils/utilsgeral.js'
import func from './followUp.js'
import OpenAI from "openai";

const openai = new OpenAI();

async function generateSummary(context: string): Promise<string> {
    try {
       const response =await openai.chat.completions.create({
          messages: [{ role: "system", content: `analise o contexto da conversa, retorne as informações a seguir. 
          Resumo do Atendimento:\n
          Nome cliente:\nveiculo de interese:\nTroca de Veículo ou valor de entrada:\nInterese financiamento:\nCPF fornecido para simulação:\nAgendamento:\n.

          /////
          ${context}
          /////
          informe apenas das informações que você precisa, sem observações ou comentarios, lembre-se de informar o CPF apenas com os numeros, sem pontos nem espaços.` }],
          model: "gpt-3.5-turbo",
        });
  
        if (response.choices && response.choices.length > 0 && response.choices[0].message.content) {
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


function extractAndVerifyCPF(input: string): string | null {
    // Regex para encontrar uma linha com CPF
    const cpfPattern = /CPF fornecido para simulação: (\d{11})/;
    const match = input.match(cpfPattern);

    if (match && match[1]) {
        // Se o CPF foi encontrado, retorna o CPF
        console.log(match[1])
        return match[1];
    } else {
        // Se não foi encontrado, retorna null
        return null;
    }
}
export async function summary(chat_id:string){
    const history = await  func.getConversationHistory(chat_id)
    const summ = await generateSummary(history)
    const cpf = extractAndVerifyCPF(summ)
    let cpfstring = "não informado"
    if (cpf) {
        try {
          const cpfAnalise = await utils.CPF(cpf);
          if (cpfAnalise && cpfAnalise.nome && cpfAnalise.cpf && cpfAnalise.risco && cpfAnalise.risco.nivel && cpfAnalise.risco.score && cpfAnalise.risco.descricao) {
            cpfstring = `Nome:${cpfAnalise.nome}\nTelefone:${chat_id.replace('chat_','').replace('@s.whatsapp.net','')}\nCPF:${cpfAnalise.cpf}\nRisco:risco:${cpfAnalise.risco.nivel}\nPontuação:${cpfAnalise.risco.score}\nDescrição:${cpfAnalise.risco.descricao}`;
          } else {        
            console.error('Retorno inválido da função utils.CPF');
          }
        } catch (error) {
          cpfstring = 'CPF informado é invalido';
          console.error('Erro ao analisar o CPF:', error);
        }
      }
    utils.sendEmail(`${summ}\nTelefone:${chat_id.replace('chat_','').replace('@s.whatsapp.net','')} \n\n${cpfstring}`,chat_id)
    console.log(`${summ}\nTelefone:${chat_id.replace('chat_','').replace('@s.whatsapp.net','')} \n\n${cpfstring}`)      
 }

 