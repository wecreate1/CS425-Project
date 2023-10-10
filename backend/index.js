import * as db from './db';
import express from 'express';

const app = express();

const sql = (s) => {
    return s;
}

app.route('/api/v1/users')
    .get((req, res) => {

    });
// app.route('/api/v1/users/me'); // to do when auth is implemented
app.route('/api/v1/users/:id');
app.route('/api/v1/courses')
    .get((req, res) => {
        const { student, instructor } = req.query;
    });
app.route('/api/v1/courses/:id');
app.route('/api/v1/courses/:id/scale');
app.route('/api/v1/enrollments')
    .get((req, res) => {
        const { course, student } = req.query;
    });
app.route('/api/v1/enrollments/:id');
app.route('/api/v1/weights')
    .get((req, res) => {
        const { course } = req.query;
    });
app.route('/api/v1/weights/:id');
app.route('/api/v1/assignments')
    .get((req, res) => {
        const { weight, course } = req.query;
    });
app.route('/api/v1/assignments/:id');
app.route('/api/v1/evaluations')
    .get((req, res) => {
        const { assignment, weight, course, enrollee, student, instructor } = req.query;
    });
app.route('/api/v1/evaluations/:id');

