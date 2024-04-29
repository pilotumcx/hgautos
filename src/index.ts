import { startWhatsAppSocket } from './messages/sessionManager.js';
import express from 'express';
import utils from './utils/utilsgeral.js'
import utilsdb from './utils/utilsdb.js'

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all('/carro', utilsdb.getCar);

app.listen(5000, () => {
  console.log("App Listening on 5000 !");
});


utils.createdirs()
startWhatsAppSocket();
