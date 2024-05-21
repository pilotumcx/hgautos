import express, {Router}from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import cors from 'cors'


const app = express()
app.use(helmet());
app.use(bodyParser.json());
app.use(cors());


export default app;
