import {Sequelize} from 'sequelize';
import fs from 'fs'


/*export const pineconeCLient = new Pinecone({
  apiKey: "d01eeb9a-eab1-4407-9fe3-9d0e76f222e6",
  environment: "gcp-starter"
})*/

const dbName =process.env.database!
const dbUser = process.env.user!
const dbPassword = process.env.password!
const dbHost = process.env.host!
const dbPort = process.env.port!

export const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  dialect: "mysql",
  host: dbHost,
  port: 22701,
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false, // Accept self-signed certificates (use with caution)
      ca: fs.readFileSync("ca.pem"), // Replace with the actual path to your CA certificate
    },
  },
})


export default sequelize;