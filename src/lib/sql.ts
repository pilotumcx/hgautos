import { parseStringPromise } from 'xml2js';
import axios from 'axios';
import dotenv from "dotenv"
import {pool} from './db.js'
dotenv.config()
// Define the Ad interface
const deleteQuery = `DELETE FROM veiculos`;
const insertQuery = `
    INSERT INTO veiculos (
        id,
        marca,
        modelo,
        categoria,
        acessorios,
        ano,
        ano_fabricacao,
        quilometragem,
        combustivel,
        motor,
        portas,
        cor,
        preco_valor,
        fipe,
        tipo_de_corpo,
        hp,
        link
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
`;

// Function to parse XML
async function parseXml(xml: string){
  try {
    const result = await parseStringPromise(xml, { explicitArray: true });
    return result;
  } catch (error) {
    console.error('Error parsing XML:', error);
    throw error;
  }
}

// Fetch and parse the XML from the URL
export async function fetchAndParseSql() {
  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://app.revendamais.com.br/application/index.php/apiGeneratorXml/generator/sitedaloja/ea39ff712edc3986a73b87a7ff83edee4877.xml',
    headers: { 
      'Content-Type': 'application/json', 
      'Cookie': 'Path=/; revendamais=kplkdc4q078d7r5mfvkt4521v7'
    }
  };

  try {
    const response = await axios.request(config);
    const ads = await parseXml(response.data);
    console.log(ads.ADS.AD.length);

    await pool.query(deleteQuery);
    console.log('All existing records deleted.');

    for(const ad of ads.ADS.AD){
      const id = ad.ID[0];
      const titleParts = ad.TITLE[0].split(' ');
      
      // Assumindo que a marca é a primeira palavra e o modelo é a segunda palavra
      const marca = titleParts[0];
      const modelo = titleParts.slice(1, -1).join('-'); // Pega tudo exceto a última parte (ano)
      const ano = titleParts.at(-1); // Pega a última parte do título que assumimos ser o ano
      
      // URL base (altere com a cidade/estado conforme necessário)
      const baseUrl = 'https://hgautos.com.br/carros';
      const cidadeEstado = 'Sao-Paulo-Sao-Paulo'
      const url = `${baseUrl}/${marca}/${modelo}/${marca}-${modelo}-${ano}-${cidadeEstado}-${id}.html`;
      const carro = {
        ID: ad.ID[0],
        MARCA: ad.MAKE[0],
        MODELO: ad.MODEL[0],
        CATEGORIA: ad.CATEGORY[0],
        ACESSORIOS: ad.ACCESSORIES[0],
        ANO: ad.YEAR[0],
        ANO_FABRICACAO: ad.FABRIC_YEAR[0],
        QUILOMETRAGEM: ad.MILEAGE[0],
        COMBUSTIVEL: ad.FUEL[0],
        MOTOR: ad.MOTOR[0],
        PORTAS: ad.DOORS[0],
        COR: ad.COLOR[0],
        PRECO_VALOR: ad.PRICE[0],
        FIPE: ad.VALOR_FIPE[0],
        TIPO_DE_CORPO: ad.BODY_TYPE[0],
        HP: ad.HP[0],
        LINK: url
    };
    
    const values = [
        carro.ID,
        carro.MARCA,
        carro.MODELO,
        carro.CATEGORIA,
        carro.ACESSORIOS,
        carro.ANO,
        carro.ANO_FABRICACAO,
        carro.QUILOMETRAGEM,
        carro.COMBUSTIVEL,
        carro.MOTOR,
        carro.PORTAS,
        carro.COR,
        carro.PRECO_VALOR,
        carro.FIPE,
        carro.TIPO_DE_CORPO,
        carro.HP,
        carro.LINK
    ];
    const [rows]:any = await pool.query(insertQuery, values)
    console.log(rows) 
    }
    // Do something with the extracted data
  } catch (error) {
    console.log('Error fetching or parsing XML:', error);
  }
}
