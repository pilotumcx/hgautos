import app from './app.js';
import sequelize from "./db.js";
import { startWhatsAppSocket } from './messages/sessionManager.js';
import utils from './utils/utilsgeral.js'
import utilsdb from './utils/utilsdb.js'
import cron from 'node-cron';
import {processFollowUpMessages} from './lib/followUp.js'
import {fetchAndParseXml} from './lib/hgautoXML.js' 



const server = async () => {
try {
const port = 7004
const scheduledTaskXML = cron.schedule('30 2 * * *', async () => {
    console.log('Executando fetchAndParseXml...');
    await fetchAndParseXml();
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  });
  scheduledTaskXML.start();
  
  const scheduledTaskFollow = cron.schedule('0 9-18 * * *', async () => {
    await processFollowUpMessages();
  },  {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  });
  scheduledTaskFollow.start();
  app.all('/carro', utilsdb.getCar);
  
utils.createdirs()
startWhatsAppSocket();
await sequelize.sync();
console.log(`Runnig database" ${process.env.DB_NAME}`);

await app.listen(port)
console.log(`Running on port ${port}`);
utils.createdirs()
}
catch (error) {
    console.log(`${error}`);
}
}
server()