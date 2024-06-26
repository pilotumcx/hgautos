import app from './app.js';
import sequelize from "./db.js";
import { startWhatsAppSocket } from './messages/sessionManager.js';
import utils from './utils/utilsgeral.js'
import utilsdb from './utils/utilsdb.js'
import cron from 'node-cron';
import {processFollowUpMessages} from './lib/followUp.js'
import {fetchAndParseXml} from './lib/hgautoXML.js' 
import {fetchAndParseSql} from './lib/sql.js' 
import {sqlToll} from './controllers/sqlQuery.js'


const server = async () => {
try {
const port = 7004
const scheduledTaskXML = cron.schedule('30 2 * * *', async () => {
    console.log('Executando fetchAndParseXml...');
    await fetchAndParseSql();
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
  app.all('/querytoll', sqlToll);
  
utils.createdirs()
startWhatsAppSocket();
await sequelize.sync();
console.log(`Runnig database" ${process.env.database}`);

await app.listen(port)
console.log(`Running on port ${port}`);
utils.createdirs()
}
catch (error) {
    console.log(`${error}`);
}
}
server()