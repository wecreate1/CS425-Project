import pg from 'pg';
import sqlUtil from 'sql-template-strings';
import dedent from 'dedent';

const { Pool } = pg;

const pool = new pg.Pool();

export const query = (text, params, callback) => {
    return pool.query(text, params, callback);
}

export const getClient = () => {
    return pool.connect();
}

export const sql = (...params) => {
    return sqlUtil(...params);
}
