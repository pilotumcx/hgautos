import { Request, Response } from 'express';
import {pool} from '../lib/db.js'

export const sqlToll = async (req: Request, res: Response) => {
  const { query } = req.body;
  try {
    const result: any = await pool.query(query);
    res.json(result);
  } catch (error) {
    res.status(500).send(error);
  }
};
