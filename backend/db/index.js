import { Pool } from 'pg';

const pool = new Pool();

export const query = (text, param, callback) => {
    return pool.query(text, params, callback);
}