import { parseStringPromise } from 'xml2js';
import axios from 'axios';
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import dotenv from "dotenv"
dotenv.config()
import { pineconeCLient } from './db.js';

// Define the Ad interface
interface Ad {
  [x: string]: any;
  ID: string[];
  DATE: string[];
  TITLE: string[];
  CATEGORY: string[];
  ACCESSORIES: string[];
  MAKE: string[];
  MODEL: string[];
  YEAR: string[];
  FABRIC_YEAR: string[];
  CONDITION: string[];
  MILEAGE: string[];
  FUEL: string[];
  GEAR: string[];
  MOTOR: string[];
  CHASSI: string[];
  DOORS: string[];
  COLOR: string[];
  PRICE: string[];
  FIPE: string[];
  VALOR_FIPE: string[];
  PERICIA: string[];
  LAST_UPDATE: string[];
  PROMOTION_PRICE: string[];
  BODY_TYPE: string[];
  HP: string[];
  BASE_MODEL: string[];
}
const deletepinecone = async () => {
  const index = pineconeCLient.index('mindbot');
  const ns = index.namespace('hgautos12');
  await ns.deleteAll();
  }
// Function to parse XML
async function parseXml(xml: string): Promise<Ad> {
  try {
    const result = await parseStringPromise(xml, { explicitArray: true });
    return result;
  } catch (error) {
    console.error('Error parsing XML:', error);
    throw error;
  }
}

// Fetch and parse the XML from the URL
export async function fetchAndParseXml() {
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
    await deletepinecone()
    const response = await axios.request(config);
    const ads = await parseXml(response.data);
    console.log(ads.ADS.AD.length);
    let processedDocs:any[] = []
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
      const carro = `
          NOME: ${ad.TITLE[0]},
          CATEGORIA: ${ad.CATEGORY[0]},
          ACESSORIOS: ${ad.ACCESSORIES[0]},
          ANO: ${ad.YEAR[0]},
          ANO_FABRICACAO: ${ad.FABRIC_YEAR[0]},
          QUILOMETRAGEM: ${ad.MILEAGE[0]},
          COMBUSTIVEL: ${ad.FUEL[0]},
          MOTOR: ${ad.MOTOR[0]},
          PORTAS: ${ad.DOORS[0]},
          COR: ${ad.COLOR[0]},
          PRICE: ${ad.PRICE[0]},
          VALOR_FIPE: ${ad.VALOR_FIPE[0]},
          LAUDO: ${ad.PERICIA[0]},
          PRECO_PROMOCIONAL: ${ad.PROMOTION_PRICE[0]},
          TIPO_DE_CORPO: ${ad.BODY_TYPE[0]},
          HP: ${ad.HP[0]},
          LINK: ${url}
        `
    const pageContent = carro.toLocaleLowerCase()
    processedDocs.push(new Document({ pageContent }));
    }
    const pineconeIndex = pineconeCLient.Index("mindbot");
    await PineconeStore.fromDocuments(processedDocs, new OpenAIEmbeddings(), {
    pineconeIndex,
    namespace: "hgautos12",
    maxConcurrency: 5, // Maximum number of batch requests to allow at once. Each batch is 1000 vectors.
  })
    console.log('Done!');
  } catch (error) {
    console.log('Error fetching or parsing XML:', error);
  }
}
  // Assuming the structure is { ADS: { AD: [...] } } based on your log
  // Loop through each ad and map to Ad interface structure
  