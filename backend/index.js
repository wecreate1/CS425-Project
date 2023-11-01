import * as db from './db';
import { sql } from './db';
import * as model from './model';
import express from 'express';
import { query, param, validationResult, body } from 'express-validator';

function validate(req, res, next) {
    if (!validationResult(req).isEmpty()) {
        res.sendStatus(400);
        return;
    }
    next();
}

const roleSym = Symbol('role');

const ROLE_ADMIN = 1;
const ROLE_USER = 2;
const ROLE_STUDENT = 3;
const ROLE_INSTRUCTOR = 4;
const ROLE_INVALID = 0;

function sendWithRole(res, role, val) {
    if (role == ROLE_INVALID) {
        res.sendStatus(400);
    } else if (Array.isArray(val)) {
        if (role == ROLE_ADMIN) {
            res.sendJson(val.map(obj => obj.forAdmin()));
        } else if (role == ROLE_USER) {
            res.sendJson(val.map(obj => obj.forUser()));
        } else if (role == ROLE_STUDENT) {
            res.sendJson(val.map(obj => obj.forStudent()));
        } else if (role == ROLE_INSTRUCTOR) {
            res.sendJson(val.map(obj => obj.forInstructor()));
        }
    } else if (val == undefined) {
        res.sendStatus(404);
    } else {
        if (role == ROLE_ADMIN) {
            res.sendJson(val.forAdmin());
        } else if (role == ROLE_USER) {
            res.sendJson(val.forUser());
        } else if (role == ROLE_STUDENT) {
            res.sendJson(val.forStudent());
        } else if (role == ROLE_INSTRUCTOR) {
            res.sendJson(val.forInstructor());
        }
    }
}

function roleMw(req, res, next) {
    res[roleSym] = ROLE_INVALID;
    res.setRole = function(role) {this[roleSym] = role};
    res.sendWithRole = function(val) {sendWithRole(this, this[roleSym], val)}
    next();
}

const app = express();

app.use(express.json());
app.use(roleMw);

app.route('/api/v1/users')
    .get(async (req, res) => {
        // TODO: assert that authorized user is allowed to do this
        const users = await model.User.findAll();
        res.setRole(ROLE_ADMIN);
        res.sendWithRole(users);
    })
    .post(
        body('name').isString(),
        validate,
        async (req, res) => {
            // TODO: auth
            const id = await model.User.create(req.body);
            if (id == undefined) {
                res.sendStatus(500);
            } else {
                res.status(201);
                res.set("Location", `/api/v1/users/${id}`);
                res.json({id});
            }

    });
// app.route('/api/v1/users/me'); // TODO: when auth is implemented
app.route('/api/v1/users/:id')
    .get(
        param('id').isInt(),
        validate,
        async (req, res) => {
            const id = parseInt(req.params.id);
            // TODO: assert id == authorized user
            const user = await model.User.findById(id);
            res.setRole(false /* isAdmin */ ? ROLE_ADMIN : ROLE_USER)
            res.sendWithRole(user);
        })
    .put(
        param('id').isInt(),
        body('name').isString(),
        validate,
        async (req, res) => {
            const id = parseInt(req.params.id);
            const result = await model.User.update(id, req.body);
            if (result) {
                res.sendStatus(204);
            } else {
                res.sendStatus(500);
            }
        }
    )
    .delete(
        param('id').isInt(),
        validate,
        async (req, res) => {
            const id = parseInt(req.params.id);
            const result = model.User.delete(id);
            if (result) {
                res.sendStatus(204);
            } else {
                res.sendStatus(500);
            }
        });
app.route('/api/v1/courses')
    .get(
        query('student').optional().isInt(),
        query('instructor').optional().isInt(),
        validate,
        async (req, res) => {

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
                res.setRole(ROLE_STUDENT);
            } else if (instructor != undefined) {
                let instructorId = parseInt(instructor);
                // TODO: assert instructorId == authorized user
                courses = await model.Course.findManyByInstructorId(instructorId);
                res.setRole(ROLE_INSTRUCTOR);
            } else {
                // TODO: assert that authorized user is allowed to do this
                if (false /* isAdmin */) {
                    courses = await model.Course.findAll();
                    res.setRole(ROLE_ADMIN);
                }
            }

            if (false /* isAdmin */) {
                res.setRole(ROLE_ADMIN);
            }

            res.sendWithRole(courses);
    });
app.route('/api/v1/courses/:id')
    .get(
        param('id').isInt(),
        query('for').isIn(['student', 'instructor', 'admin']),
        validate,
        async (req, res) => {
            const id = parseInt(req.params.id);

            // TODO: assert authorized user is enrolled in or instructs course

            const course = await model.Course.findById(id);

            if (false /* isAdmin */) {
                res.setRole(ROLE_ADMIN);
            } else if (req.query.for == 'student') {
                res.setRole(ROLE_STUDENT);
            } else if (req.query.for == 'instructor') {
                res.setRole(ROLE_INSTRUCTOR);
            }

            res.sendWithRole(course);
        });
app.route('/api/v1/courses/:id/scale')
    .get(
        param('id').isInt(),
        query('for').isIn(['student', 'instructor', 'admin']),
        validate,
        async (req, res) => {
            const id = parseInt(req.params.id);

            // TODO: assert authorized user is enrolled in or instructs course

            const scale = await model.Scale.findByCourseId(id);

            if (false /* isAdmin */) {
                res.setRole(ROLE_ADMIN);
            } else if (req.query.for == 'student') {
                res.setRole(ROLE_STUDENT);
            } else if (req.query.for == 'instructor') {
                res.setRole(ROLE_INSTRUCTOR);
            }

            res.sendWithRole(scale);
        });
app.route('/api/v1/enrollments')
    .get(
        query('student').optional().isInt(),
        query('course').optional().isInt(),
        validate,
        async (req, res) => {
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
                res.setRole(ROLE_STUDENT);
            } else if (course != undefined) {
                let courseId = parseInt(course);
                // TODO: assert authorized user is instructor of course
                enrollments = await model.Enrollment.findManyByCourseId(courseId);
                res.setRole(ROLE_INSTRUCTOR);
            } else {
                // TODO: assert that authorized user is allowed to do this
                if (false /* isAdmin */) {
                    enrollments = await model.Enrollment.findAll();
                }
            }
            if (false /* isAdmin */) {
                res.setRole(ROLE_ADMIN);
            }

            res.sendWithRole(enrollments);
        });
app.route('/api/v1/enrollments/:id')
    .get(
        param('id').isInt(),
        query('for').isIn(['student', 'instructor', 'admin']),
        validate,
        async (req, res) => {
            const id = parseInt(req.params.id);

            // TODO: assert authorized user is enrolled in or instructs course

            const enrollment = await model.Enrollment.findById(id);

            if (false /* isAdmin */) {
                res.setRole(ROLE_ADMIN);
            } else if (req.query.for == 'student') {
                res.setRole(ROLE_STUDENT);
            } else if (req.query.for == 'instructor') {
                res.setRole(ROLE_INSTRUCTOR);
            }

            res.sendWithRole(enrollment);
        });
app.route('/api/v1/instructs')
    .get(
        query('instructor').isInt(),
        validate,
        async (req, res) => {
            const { instructor } = req.query;
            const instructorId = parseInt(instructor);
            // TODO: auth
            const instructs = await model.Instructs.findManyByInstructorId(instructorId);

            if (false /* isAdmin */) {
                res.setRole(ROLE_ADMIN);
            } else {
                res.setRole(ROLE_INSTRUCTOR);
            }
            res.sendWithRole(instructs);
        });
app.route('/api/v1/weights')
    .get(
        query('course').optional().isInt(),
        query('for').isIn(['student', 'instructor', 'admin']),
        validate,
        async (req, res) => {
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
                res.setRole(ROLE_ADMIN);
            } if (req.query.for == 'student') {
                res.setRole(ROLE_STUDENT);
            } else if (req.query.for == 'instructor') {
                res.setRole(ROLE_INSTRUCTOR);
            }

            res.sendWithRole(weights);
        });
app.route('/api/v1/weights/:id')
    .get(
        param('id').isInt(),
        query('for').isIn(['student', 'instructor', 'admin']),
        validate,
        async (req, res) => {
            const id = parseInt(req.params.id);

            // TODO: auth

            const weight = await model.Weight.findById(id);

            if (false /* isAdmin */) {
                res.setRole(ROLE_ADMIN);
            } else if (req.query.for == 'student') {
                res.setRole(ROLE_STUDENT);
            } else if (req.query.for == 'instructor') {
                res.setRole(ROLE_INSTRUCTOR);
            }

            res.sendWithRole(weight);
        });
app.route('/api/v1/assignments')
    .get(
        query('weight').optional().isInt(),
        query('for').isIn(['student', 'instructor', 'admin']),
        validate,
        async (req, res) => {
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
                res.setRole(ROLE_ADMIN);
            } else if (req.query.for == 'student') {
                res.setRole(ROLE_STUDENT);
            } else if (req.query.for == 'instructor') {
                res.setRole(ROLE_INSTRUCTOR);
            }

            res.sendWithRole(assignments);
        });
app.route('/api/v1/assignments/:id')
    .get(
        param('id').isInt(),
        query('for').isIn(['student', 'instructor', 'admin']),
        validate,
        async (req, res) => {
            const id = parseInt(req.params.id);
            const assignment = await model.Assignment.findById(id);
            // TODO: auth

            if (false /* isAdmin */) {
                res.setRole(ROLE_ADMIN);
            } else if (req.query.for == 'student') {
                res.setRole(ROLE_STUDENT);
            } else if (req.query.for == 'instructor') {
                res.setRole(ROLE_INSTRUCTOR);
            }

            res.sendWithRole(assignment);
        });
app.route('/api/v1/evaluations')
    .get(
        query('assignment').optional().isInt(),
        query('enrollee').optional().isInt(),
        query('for').isIn(['student', 'instructor', 'admin']),
        validate,
        async (req, res) => {
            const { assignment, enrollee } = req.query;
            const assignmentId = parseInt(assignment);
            const enrolleeId = parseInt(enrollee);

            let evaluations;

            // TODO: auth

            if (assignment != undefined && enrollee != undefined) {
                evaluations = await model.Evaluation.findByAssignmentIdAndEnrolleeId(assignmentId, enrolleeId);
                evaluations = evaluations == undefined ? [] : [evaluations];
            } else if (assignment != undefined) {
                evaluations = await model.Evaluation.findManyByAssignmentId(assignmentId);
            } else if (enrolleeId != undefined) {
                evaluations = await model.Evaluation.findManyByEnrolleeId(enrolleeId);
            }

            if (false /* isAdmin */) {
                res.setRole(ROLE_ADMIN);
            } else if (role == 'student') {
                res.setRole(ROLE_STUDENT);
            } else if (role == 'instructor') {
                res.setRole(ROLE_INSTRUCTOR);
            }

            res.sendWithRole(evaluations);
        });
app.route('/api/v1/evaluations/e/:enrollee/a/:assignment')
    .get(
        param('enrollee').isInt(),
        param('assignment').isInt(),
        query('for').isIn(['student', 'instructor', 'admin']),
        validate,
        async (req, res) => {
            const { assignment, enrollee } = req.query;
            const assignmentId = parseInt(assignment);
            const enrolleeId = parseInt(enrollee);

            // TODO: auth

            const evaluation = await model.Evaluation.findByAssignmentIdAndEnrolleeId(assignmentId, enrolleeId);

            if (false /* isAdmin */) {
                res.setRole(ROLE_ADMIN);
            } else if (role == 'student') {
                res.setRole(ROLE_STUDENT);
            } else if (role == 'instructor') {
                res.setRole(ROLE_INSTRUCTOR);
            }

            res.sendWithRole(evaluation);
        }
    )
app.route('/api/v1/evaluations/weight')
    .get(
        query('weight').optional().isInt(),
        query('enrollee').optional().isInt(),
        query('for').isIn(['student', 'instructor', 'admin']),
        validate,
        async (req, res) => {
            const { weight, enrollee } = req.query;
            const weightId = parseInt(weight);
            const enrolleeId = parseInt(enrollee);

            let evaluatedWeights;

            // TODO: auth

            if (weight != undefined && enrollee != undefined) {
                evaluatedWeights = await model.EvaluatedWeight.findByWeightIdAndEnrolleeId(weightId, enrolleeId);
                evaluatedWeights = evaluatedWeights == undefined ? [] : [evaluatedWeights];
            } else if (weight != undefined) {
                evaluatedWeights = await model.EvaluatedWeight.findManyByWeightId(weightId);
            } else if (enrolleeId != undefined) {
                evaluatedWeights = await model.EvaluatedWeight.findManyByEnrolleeId(enrolleeId);
            }

            if (false /* isAdmin */) {
                res.setRole(ROLE_ADMIN);
            } else if (role == 'student') {
                res.setRole(ROLE_STUDENT);
            } else if (role == 'instructor') {
                res.setRole(ROLE_INSTRUCTOR);
            }

            res.sendWithRole(evaluatedWeights);
        }
    );
app.route('/api/v1/evaluations/weight/e/:enrollee/w/:weight')
    .get(
        param('enrollee').isInt(),
        param('weight').isInt(),
        query('for').isIn(['student', 'instructor', 'admin']),
        validate,
        async (req, res) => {
            const { weight, enrollee } = req.query;
            const weightId = parseInt(weight);
            const enrolleeId = parseInt(enrollee);

            // TODO: auth

            const evaluation = await model.EvaluatedWeight.findByWeightIdAndEnrolleeId(weightId, enrolleeId);

            if (false /* isAdmin */) {
                res.setRole(ROLE_ADMIN);
            } else if (role == 'student') {
                res.setRole(ROLE_STUDENT);
            } else if (role == 'instructor') {
                res.setRole(ROLE_INSTRUCTOR);
            }

            res.sendWithRole(evaluation);
        }
    );
app.route('/api/v1/evaluations/course') // theese should take a student user as well
    .get(
        query('course').optional().isInt(),
        query('enrollee').optional().isInt(),
        query('for').isIn(['student', 'instructor', 'admin']),
        validate,
        async (req, res) => {
            const { course, enrollee } = req.query;
            const courseId = parseInt(course);
            const enrolleeId = parseInt(enrollee);

            let evaluatedCourses;

            // TODO: auth

            if (course != undefined && enrollee != undefined) {
                evaluatedCourses = await model.EvaluatedWeight.findByWeightIdAndEnrolleeId(courseId, enrolleeId);
                evaluatedCourses = evaluatedCourses == undefined ? [] : [evaluatedCourses];
            } else if (course != undefined) {
                evaluatedCourses = await model.EvaluatedWeight.findManyByWeightId(courseId);
            } else if (enrolleeId != undefined) {
                evaluatedCourses = await model.EvaluatedWeight.findManyByEnrolleeId(enrolleeId);
            }

            if (false /* isAdmin */) {
                res.setRole(ROLE_ADMIN);
            } else if (role == 'student') {
                res.setRole(ROLE_STUDENT);
            } else if (role == 'instructor') {
                res.setRole(ROLE_INSTRUCTOR);
            }

            res.sendWithRole(evaluatedCourses);
        }
    );
app.route('/api/v1/evaluations/course/e/:enrollee/c/:course')
    .get(
        param('enrollee').isInt(),
        param('course').isInt(),
        query('for').isIn(['student', 'instructor', 'admin']),
        validate,
        async (req, res) => {
            const { course, enrollee } = req.query;
            const courseId = parseInt(course);
            const enrolleeId = parseInt(enrollee);

            // TODO: auth

            const evaluation = await model.EvaluatedCourse.findByCourseIdAndEnrolleeId(courseId, enrolleeId);

            if (false /* isAdmin */) {
                res.setRole(ROLE_ADMIN);
            } else if (role == 'student') {
                res.setRole(ROLE_STUDENT);
            } else if (role == 'instructor') {
                res.setRole(ROLE_INSTRUCTOR);
            }

            res.sendWithRole(evaluation);
        }
    );
// app.route('/api/v1/evaluations/:id');

