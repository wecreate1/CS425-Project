import * as db from './db';
import { sql } from './db';
import * as model from './model';
import express from 'express';
import { query, param, validationResult } from 'express-validator';

const app = express();

app.use(express.json());

app.route('/api/v1/users')
    .get(async (req, res) => {
        // TODO: assert that authorized user is allowed to do this
        res.json(await model.User.findAll());
    });
// app.route('/api/v1/users/me'); // TODO: when auth is implemented
app.route('/api/v1/users/:id')
    .get(param('id').isInt(), async (req, res) => {
        if (!validationResult(req).isEmpty()) {
            res.sendStatus(400);
            return;
        }
        const id = parseInt(req.params.id);
        // TODO: assert id == authorized user
        const user = await model.User.findById(id);
        if (user == undefined) {
            res.sendStatus(404);
            return;
        }
        res.json(user);
    });
app.route('/api/v1/courses')
    .get(query('student').optional().isInt(),
        query('instructor').optional.isInt(),
        async (req, res) => {
            if (!validationResult(req).isEmpty()) {
                res.sendStatus(400);
                return;
            }

            const { student, instructor } = req.query;

            if (student != undefined && instructor != undefined) {
                res.sendStatus(400);
                return;
            }

            if (student != undefined) {
                let studentId = parseInt(student);
                // TODO: assert studentId == authorized user
                res.json(await model.Course.findManyByStudentId(studentId));
            } else if (instructor != undefined) {
                let instructorId = parseInt(instructor);
                // TODO: assert instructorId == authorized user
                res.json(await model.Course.findManyByInstructorId(instructorId));
            } else {
                // TODO: assert that authorized user is allowed to do this
                res.json(await model.Course.findAll());
            }
    });
app.route('/api/v1/courses/:id')
    .get(param('id').isInt(), async (req, res) => {
        if (!validationResult(req).isEmpty()) {
            res.sendStatus(400);
            return;
        }

        let id = parseInt(req.params.id);

        // TODO: assert authorized user is enrolled in or instructs course

        const course = await model.Course.findById(id);
        if (user == undefined) {
            res.sendStatus(404);
            return;
        }
        res.json(user);
    });
app.route('/api/v1/courses/:id/scale')
    .get(param('id').isInt(), async (req, res) => {
        if (!validationResult(req).isEmpty()) {
            res.sendStatus(400);
            return;
        }
        
        let id = parseInt(req.params.id);

        // TODO: assert authorized user is enrolled in or instructs course

        res.json(await model.Scale.findByCourseId(id));
    });
app.route('/api/v1/enrollments')
    .get((req, res) => {
        const { course, student } = req.query;
        // instructors should recieve {id, course, name, email, metadata, [maybe linked status]}
        // students should recieve {id, course, student, name}
    });
app.route('/api/v1/enrollments/:id');
app.route('/api/v1/instructs')
    .get((req, res) => {
        const { instructor } = req.query;
        // TODO: support multiple instructors on a course
    });
app.route('/api/v1/instructs/:id');
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

