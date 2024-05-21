import fs from 'fs/promises';
import path from 'path';
import { WAProto as proto, initAuthCreds, BufferJSON } from "@whiskeysockets/baileys";
import {Session} from '../models/sessions.js';


const fixFileName = (file: string): string | undefined => {
    if (!file) {
      return undefined;
    }
    const replacedSlash = file.replace(/\//g, '__');
    const replacedColon = replacedSlash.replace(/:/g, '-');
    return replacedColon;
  };
  
  export async function keyExists(sessionID: string): Promise<boolean> {
    try {
      let key = await Session.findOne({ where: { sessionID } });
      return !!key;
    } catch (error) {
      console.log(`${error}`);
      return false;
    }
  }
  
  export async function saveKey(sessionID: string, keyJson: any): Promise<void> {
    const jaExiste = await keyExists(sessionID);
    try {
      if (!jaExiste) {
        await Session.create({ sessionID, creds: JSON.stringify(keyJson) });
      } else {
        await Session.update({ creds: JSON.stringify(keyJson) }, { where: { sessionID } });
      }
    } catch (error) {
      console.log(`${error}`);
    }
  }
  
  export async function getAuthKey(sessionID: string): Promise<any | null> {
    try {
      let registro = await keyExists(sessionID);
      if (!registro) return null;
      let auth = await Session.findOne({ where: { sessionID } });
      return auth ? JSON.parse(auth.creds) : null;
    } catch (error) {
      console.log(`${error}`);
      return null;
    }
  }
  
  async function deleteAuthKey(sessionID: string): Promise<void> {
    try {
      let registro = await keyExists(sessionID);
      if (!registro) return;
      await Session.destroy({ where: { sessionID } });
    } catch (error) {
      console.log('2', `${error}`);
    }
  }
  
  async function fileExists(file: string): Promise<boolean> {
    try {
      const stat = await fs.stat(file);
      return stat.isFile();
    } catch (error) {
      return false;
    }
  }
  
  export default async function useSequelizeDBAuthStore(sessionID: string) {
    const localFolder = path.join(process.cwd(), 'sessions', sessionID);
    const localFile = (key: string) => path.join(localFolder, (fixFileName(key) + '.json'));
    await fs.mkdir(localFolder, { recursive: true });
  
    async function writeData(data: any, key: string): Promise<void> {
      const dataString = JSON.stringify(data, BufferJSON.replacer);
  
      if (key !== 'creds') {
        await fs.writeFile(localFile(key), dataString);
        return;
      }
      await saveKey(sessionID, dataString);
    }
  
    async function readData(key: string): Promise<any> {
      try {
        let rawData: string | any;
  
        if (key !== 'creds') {
          if (!(await fileExists(localFile(key)))) return null;
          rawData = await fs.readFile(localFile(key), { encoding: 'utf-8' });
        } else {
          rawData = await getAuthKey(sessionID);
        }
  
        const parsedData = JSON.parse(rawData, BufferJSON.reviver);
        return parsedData;
      } catch (error) {
        return null;
      }
    }
  
    async function removeData(key: string): Promise<void> {
      try {
        if (key !== 'creds') {
          await fs.unlink(localFile(key));
        } else {
          await deleteAuthKey(sessionID);
        }
      } catch (error) {
        return;
      }
    }
  
    let creds = await readData('creds');
    if (!creds) {
      creds = initAuthCreds();
      await writeData(creds, 'creds');
    }
  
    return {
      state: {
        creds,
        keys: {
          get: async (type: string, ids: string[]) => {
            const data: { [key: string]: any } = {};
            await Promise.all(ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            }));
            return data;
          },
          set: async (data: { [key: string]: { [key: string]: any } }) => {
            const tasks: Promise<void>[] = [];
            for (const category in data) {
              for (const id in data[category]) {
                const value = data[category][id];
                const key = `${category}-${id}`;
                tasks.push(value ? writeData(value, key) : removeData(key));
              }
            }
            await Promise.all(tasks);
          }
        }
      },
      saveCreds: () => {
        return writeData(creds, 'creds');
      }
    };
  }