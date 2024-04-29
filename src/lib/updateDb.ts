/*import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
//import { PineconeStore } from "langchain/vectorstores/pinecone";
//import { Pinecone } from '@pinecone-database/pinecone'
import cheerio from 'cheerio';
import axios from 'axios';
import dotenv from "dotenv"
dotenv.config()
/*

interface OfferDetails {
  name: string;
  price: number;
}

interface ProductDetails {
  productName: string;
  productDescription: string;
  productUrl: string;
  offersDetails: OfferDetails[];
}

const deletepinecone = async () => {
  const index = pineconeCLient.index('mindbot');
  const ns = index.namespace('hgautos12');
  await ns.deleteAll();
  }


const baseUrl = 'https://lollabrasil.com.br';

async function fetchProductLinks(url: string, existingUrls: Set<string>): Promise<string[]> {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const links = new Set<string>();

    $('a[href*="/products"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = new URL(href, baseUrl).toString();
        if (!existingUrls.has(fullUrl)) {
          existingUrls.add(fullUrl);
          links.add(fullUrl);
        }
      }
    });

    return Array.from(links);
  } catch (error) {
    console.error('Erro ao buscar links dos produtos:', error);
    return [];
  }
}

async function linksCloset(): Promise<string[]> {
  let productLinks: string[] = [];
  let existingLinks = new Set<string>();

  for (let cont = 1; cont <= 6; cont++) {
    const pageUrl = `${baseUrl}/collections/all?page=${cont}`;
    const linksFromPage = await fetchProductLinks(pageUrl, existingLinks);
    productLinks = productLinks.concat(linksFromPage);
  }

  console.log(`Total de links únicos dos produtos obtidos: ${productLinks.length}`);
  return productLinks;
}

async function main() {
  //await deletepinecone()
  let processedDocs: any[] = [];
  let links = await linksCloset();

  for (const link of links) {
    const response = await axios.get(link);
    const $ = cheerio.load(response.data);
    const jsonLd = $('script[type="application/ld+json"]').first().html();
    if (!jsonLd) continue;
    const productData = JSON.parse(jsonLd);

    // Extrai detalhes do produto
    const extractedDetails = extractProductDetails(productData);

    // Formata os detalhes para um formato legível
    const formattedDetails = formatProductDetails(extractedDetails);

    // Adiciona os detalhes formatados ao array de documentos processados
    const pageContent = formattedDetails
    processedDocs.push(new Document({ pageContent }));
  }

  console.log(processedDocs);
  const pineconeIndex = pineconeCLient.Index("mindbot");
  await PineconeStore.fromDocuments(processedDocs, new OpenAIEmbeddings(), {
    pineconeIndex,
    namespace: "lollabrasil2",
    maxConcurrency: 5, // Maximum number of batch requests to allow at once. Each batch is 1000 vectors.
  });
}

main();

function extractProductDetails(jsonLd: any): ProductDetails {
  // Lógica para extrair detalhes do produto a partir de jsonLd
  return {
    productName: jsonLd.name,
    productDescription: jsonLd.description,
    productUrl: jsonLd.url,
    offersDetails: jsonLd.offers.map((offer: any) => ({
      name: offer.name,
      price: offer.price
    })),
  };
}

function formatProductDetails(details: ProductDetails): string {
  // Lógica para formatar os detalhes do produto
  return `Detalhes do Produto:\nNome: ${details.productName}\nDescrição: ${details.productDescription.replace(/\n\s*\n/g, '\n').trim()}\nURL: ${baseUrl + details.productUrl}\nOfertas: ${details.offersDetails.map(offer => `Tamanho ${offer.name} por R$${offer.price}`).join(', ')}`;
}
*/