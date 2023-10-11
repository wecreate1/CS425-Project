import { Pool } from 'pg';
import sqlUtil from 'sql-template-strings';
import dedent from 'dedent';

const pool = new Pool();

export const query = (text, param, callback) => {
    return pool.query(text, params, callback);
}

const sql = (...params) => {
    return dedent(sqlUtil(...params))
}
