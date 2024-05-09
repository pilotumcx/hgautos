import { startWhatsAppSocket } from './messages/sessionManager.js';
import express from 'express';
import utils from './utils/utilsgeral.js'
import utilsdb from './utils/utilsdb.js'
import cron from 'node-cron';
import {processFollowUpMessages} from './lib/followUp.js'
import {fetchAndParseXml} from './lib/hgautoXML.js' 

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const scheduledTaskXML = cron.schedule('30 2 * * *', async () => {
  console.log('Executando fetchAndParseXml...');
  await fetchAndParseXml();
}, {
  scheduled: true,
  timezone: 'America/Sao_Paulo'
});
scheduledTaskXML.start();

const scheduledTaskFollow = cron.schedule('0 13 * * *', async () => {
  await processFollowUpMessages();
},  {
  scheduled: true,
  timezone: 'America/Sao_Paulo'
});
scheduledTaskFollow.start();
app.all('/carro', utilsdb.getCar);

app.listen(7003, () => {
  console.log("App Listening on 7003 !");
});

utils.createdirs()
startWhatsAppSocket();
