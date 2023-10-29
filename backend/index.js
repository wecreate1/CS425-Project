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
        const users = await model.User.findAll();
        res.json(users.map(user => users.forAdmin()));
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
        if (false /* isAdmin */) {
            res.json(user.forAdmin());
        } else {
            res.json(user.forUser());
        }
    });
app.route('/api/v1/courses')
    .get(query('student').optional().isInt(),
        query('instructor').optional().isInt(),
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

            let courses;

            if (student != undefined) {
                let studentId = parseInt(student);
                // TODO: assert studentId == authorized user
                courses = await model.Course.findManyByStudentId(studentId);
            } else if (instructor != undefined) {
                let instructorId = parseInt(instructor);
                // TODO: assert instructorId == authorized user
                courses = await model.Course.findManyByInstructorId(instructorId);
            } else {
                // TODO: assert that authorized user is allowed to do this
                courses = await model.Course.findAll();
            }

            if (false /* isAdmin */) {
                res.json(courses.map(course => course.forAdmin()));
            } else if (student != undefined) {
                res.json(courses.map(course => course.forStudent()));
            } else if (instructor != undefined) {
                res.json(courses.map(course => course.forInstructor()));
            } else {
                res.sendStatus(400);
            }
    });
app.route('/api/v1/courses/:id')
    .get(param('id').isInt(),
         query('for').isIn(['student', 'instructor', 'admin']),
         async (req, res) => {
            if (!validationResult(req).isEmpty()) {
                res.sendStatus(400);
                return;
            }

            let id = parseInt(req.params.id);

            // TODO: assert authorized user is enrolled in or instructs course

            const course = await model.Course.findById(id);
            if (course == undefined) {
                res.sendStatus(404);
                return;
            }
            if (false /* isAdmin */) {
                res.json(course.forAdmin());
            } else if (req.query.for == 'student') {
                res.json(course.forStudent());
            } else if (req.query.for == 'instructor') {
                res.json(course.forInstructor());
            } else {
                res.sendStatus(400);
            }
    });
app.route('/api/v1/courses/:id/scale')
    .get(param('id').isInt(),
         query('for').isIn(['student', 'instructor', 'admin']),
         async (req, res) => {
            if (!validationResult(req).isEmpty()) {
                res.sendStatus(400);
                return;
            }
            
            let id = parseInt(req.params.id);

            // TODO: assert authorized user is enrolled in or instructs course

            const scale = await model.Scale.findByCourseId(id);
            if (scale == undefined) {
                res.sendStatus(404);
                return;
            }
            if (false /* isAdmin */) {
                res.json(scale.forAdmin());
            } else if (req.query.for == 'student') {
                res.json(scale.forStudent());
            } else if (req.query.for == 'instructor') {
                res.json(scale.forInstructor());
            } else {
                res.sendStatus(400);
            }
    });
app.route('/api/v1/enrollments')
    .get(query('student').optional().isInt(),
         query('course').optional().isInt(), async (req, res) => {
            if (!validationResult(req).isEmpty()) {
                res.sendStatus(400);
                return;
            }

            const { student,  course } = req.query;

            if (student != undefined && course != undefined) {
                res.sendStatus(400);
                return;
            }

            let enrollments;

            if (student != undefined) {
                let studentId = parseInt(student);
                // TODO: assert studentId == authorized user
                enrollments = await model.Enrollment.findManyByStudentId(studentId);
            } else if (course != undefined) {
                let courseId = parseInt(course);
                // TODO: assert authorized user is instructor of course
                enrollments = await model.Enrollment.findManyByCourseId(courseId);
            } else {
                // TODO: assert that authorized user is allowed to do this
                enrollments = await model.Enrollment.findAll();
            }
            if (false /* isAdmin */) {
                res.json(enrollments.map(enrollment => enrollment.forAdmin()));
            } else if (student != undefined) {
                res.json(enrollments.map(enrollment => enrollment.forStudent()));
            } else if (course != undefined) {
                res.json(enrollments.map(enrollment => enrollment.forInstructor()));
            } else {
                res.sendStatus(400);
            }
    });
app.route('/api/v1/enrollments/:id')
    .get(param('id').isInt(),
         query('for').isIn(['student', 'instructor', 'admin']),
         async (req, res) => {
            if (!validationResult(req).isEmpty()) {
                res.sendStatus(400);
                return;
            }
            const id = parseInt(req.params.id);

            // TODO: assert authorized user is enrolled in or instructs course

            const enrollment = await model.Enrollment.findById(id);
            if (enrollment == undefined) {
                res.sendStatus(404);
                return;
            }
            if (false /* isAdmin */) {
                res.json(enrollment.forAdmin());
            } else if (req.query.for == 'student') {
                res.json(enrollment.forStudent());
            } else if (req.query.for == 'instructor') {
                res.json(enrollment.forInstructor());
            } else {
                res.sendStatus(400);
            }
         });
app.route('/api/v1/instructs')
    .get(query('instructor').isInt(),
         async (req, res) => {
            if (!validationResult(req).isEmpty()) {
                res.sendStatus(400);
                return;
            }
            const { instructor } = req.query;
            const instructorId = parseInt(instructor);
            // TODO: auth
            const instructss = await model.Instructs.findManyByInstructorId(instructorId);
            if (false /* isAdmin */) {
                res.json(instructss.map(instructs => instructs.forAdmin()));
            } else {
                res.json(instructss.map(instructs => instructs.forInstructor()))
            }
    });
app.route('/api/v1/weights')
    .get(query('course').optional().isInt(),
         query('for').isIn(['student', 'instructor', 'admin']),
         async (req, res) => {
            if (!validationResult(req).isEmpty()) {
                res.sendStatus(400);
                return;
            }
            const { course } = req.query;

            // TODO: auth

            let weights;

            if (course != undefined) {
                const courseId = parseInt(course);
                weights = await model.Weight.findManyByCourseId(courseId);
            } else {
                weights = await model.Weight.findAll();
            }

            if (false /* isAdmin */) {
                res.json(weights.map(weight => weight.forAdmin()));
            } if (req.query.for == 'student') {
                res.json(weights.map(weight => weight.forStudent()));
            } else if (req.query.for == 'instructor') {
                res.json(weights.map(weight => weight.forInstructor()));
            } else {
                res.sendStatus(400);
            }

    });
app.route('/api/v1/weights/:id')
    .get(param('id').isInt(),
         query('for').isIn(['student', 'instructor', 'admin']),
         async (req, res) => {
            if (!validationResult(req).isEmpty()) {
                res.sendStatus(400);
                return;
            }
            const id = parseInt(req.params.id);

            // TODO: auth

            const weight = await model.Weight.findById(id);
            if (weight == undefined) {
                res.sendStatus(404);
                return;
            }
            if (false /* isAdmin */) {
                res.json(weight.forAdmin())
            } else if (req.query.for == 'student') {
                res.json(weight.forStudent());
            } else if (req.query.for == 'instructor') {
                res.json(weight.forInstructor());
            } else {
                res.sendStatus(400);
            }
         });
app.route('/api/v1/assignments')
    .get(query('weight').optional().isInt(),
         query('for').isIn(['student', 'instructor', 'admin']),
         async (req, res) => {
            if (!validationResult(req).isEmpty()) {
                res.sendStatus(400);
                return;
            }
            const { weight } = req.query;
            // TODO: auth
            let assignments;
            if (weight != undefined) {
                const weightId = parseInt(weight);
                assignments = await model.Assignment.findByWeight(weightId);
            } else {
                assignments = await model.Assignment.findAll();
            }

            if (false /* isAdmin */) {
                res.json(assignments.map(assignment => assignment.forAdmin()));
            } else if (req.query.for == 'student') {
                res.json(assignments.map(assignment => assignment.forStudent()));
            } else if (req.query.for == 'instructor') {
                res.json(assignments.map(assignment => assignment.forInstructor()));
            } else {
                res.sendStatus(400);
            }
    });
app.route('/api/v1/assignments/:id')
    .get(param('id').isInt(),
         query('for').isIn(['student', 'instructor', 'admin']),
         async (req, res) => {
            if (!validationResult(req).isEmpty()) {
                res.sendStatus(400);
                return;
            }

            const id = parseInt(req.params.id);
            const assignment = model.Assignment.findById(id);
            // TODO: auth
            if (assignment == undefined) {
                res.sendStatus(404);
                return;
            }
            if (false /* isAdmin */) {
                res.json(assignment.forAdmin())
            } else if (req.query.for == 'student') {
                res.json(assignment.forStudent());
            } else if (req.query.for == 'instructor') {
                res.json(assignment.forInstructor());
            } else {
                res.sendStatus(400);
            }
        });
app.route('/api/v1/evaluations')
    .get((req, res) => {
        const { assignment, weight, course, enrollee, student, instructor } = req.query;
    });
app.route('/api/v1/evaluations/:id');

