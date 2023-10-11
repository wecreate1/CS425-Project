import * as db from './db';
import { sql } from './db';
import * as model from './model';
import express from 'express';

const app = express();

app.use(express.json());

app.route('/api/v1/users')
    .get(async (req, res) => {
        // TODO: assert that authorized user is allowed to do this
        res.json(await model.User.findAll());
    });
// app.route('/api/v1/users/me'); // TODO: when auth is implemented
app.route('/api/v1/users/:id')
    .get(async (req, res) => {
        let { id: unsafeId } = req.params;
        unsafeId = parseInt(unsafeId);
        if (unsafeId == NaN) {
            res.sendStatus(400);
            return;
        }
        const id = unsafeId;
        const user = await model.User.findById(id);
        if (user == undefined) {
            res.sendStatus(404);
            return;
        }
        res.json(user);
    });
app.route('/api/v1/courses')
    .get(async (req, res) => {
        const { student: unsafeStudent, instructor: unsafeInstructor } = req.query;

        let studentId = undefined;
        if (unsafeStudent != undefined) {
            const temp = parseInt(unsafeStudent);
            if (unsafeInstructor != undefined || temp == NaN) {
                res.sendStatus(400);
                return;
            } else {
                studentId = temp;
            }
        }

        let instructorId = undefined;
        if (unsafeInstructor != undefined) {
            const temp = parseInt(unsafeInstructor);
            if (unsafeStudent != undefined || temp == NaN) {
                res.sendStatus(400);
                return;
            } else {
                instructorId = temp;
            }
        }

        if (studentId != undefined) {
            // TODO: assert studentId == authorized user
            res.json(await model.Course.findManyByStudentId(studentId));
        } else if (instructorId != undefined) {
            // TODO: assert instructorId == authorized user
            res.json(await model.Course.findManyByInstructorId(instructorId));
        } else {
            // TODO: assert that authorized user is allowed to do this
            res.json(await model.Course.findAll());
        }
    });
app.route('/api/v1/courses/:id')
    .get(async (req, res) => {
        let { id: unsafeId } = req.params;
        unsafeId = parseInt(unsafeId);
        if (unsafeId == NaN) {
            res.sendStatus(400);
            return;
        }
        const id = unsafeId;
        const course = await model.Course.findById(id);
        if (user == undefined) {
            res.sendStatus(404);
            return;
        }
        res.json(user);
    });
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

