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
    res.setRole = function(role) {this[roleSym] = role; return this};
    res.sendWithRole = function(val) {sendWithRole(this, this[roleSym], val)}
    next();
}

function isJSONNumber(val) {
    return typeof val == 'number' && isFinite(val);
}

function isJSONInteger(val) {
    return typeof val == 'number' && isFinite(val) && Number.isInteger(val);
}

const app = express();

app.use(express.json());
app.use(roleMw);

app.route('/users')
    .get(
        async (req, res) => {
            res.sendStatus(403);
        }
    )
    .post(
        body('name').isString(),
        validate,
        async (req, res) => {
            const id = await model.User.create(req.body);
            if (id == undefined) {
                res.sendStatus(500);
            } else {
                res.status(201).set('Location', `/users/${id}`).json({id});
            }
        }
    )
app.route('/users/:id')
    .get(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const user = await model.User.findById(req.params.id);
            if (user == undefined) {
                res.sendStatus(404);
            } else {
                res.setRole(ROLE_USER).sendWithRole(user);
            }
        }
    )
    .put(
        param('id').isInt().toInt(),
        body('name').isString(),
        validate,
        async (req, res) => {
            const result = await model.User.update(req.params.id, req.body);
            res.sendStatus(result ? 204 : 500);
        }
    )
    .delete(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const result = await model.User.delete(req.params.id);
            res.sendStatus(result ? 204 : 500);
        }
    );
app.route('/users/:id/enrollments')
    .get(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            // should return both enrollment and course info
            const courses = await model.Course.findManyByStudentId(req.params.id);
            res.setRole(ROLE_STUDENT).sendWithRole(courses);
        }
    );
app.route('/users/:id/enrollments/link')
    .get(
        async (req, res) => {
            res.sendStatus(404);
        }
    );
app.route('/users/:id/instructs')
    .get(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const courses = await model.Course.findManyByInstructorId(req.params.id);
            res.setRole(ROLE_INSTRUCTOR).sendWithRole(courses);
        }
    )
    .post(
        param('id').isInt().toInt(),
        body('name').isString(),
        body('credits').custom(isJSONNumber),
        validate,
        async (req, res) => {
            const courseId = await model.Course.create(req.body);
            if (course == undefined) {
                res.sendStatus(500);
                return;
            }
            const result = await model.Instructs.create(courseId, req.params.id);
            if (!result) {
                model.Course.delete(courseId);
                res.sendStatus(500);
                return
            }
            res.status(201).set('Location', `/courses/${id}`).json({id:courseId});
        }
    );
app.route('/courses/:id')
    .get(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const course = await model.Course.findById(req.params.id);
            res.setRole(ROLE_ADMIN).sendWithRole(course);
        }
    )
    .put(
        param('id').isInt().toInt(),
        body('name').isString(),
        body('credits').custom(isJSONNumber),
        validate,
        async (req, res) => {
            const result = await model.Course.update(req.params.id, req.body);
            res.sendStatus(result ? 204 : 500);
        }
    )
    .delete(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const result = await model.Course.delete(req.params.id);
            res.sendStatus(result ? 204 : 500);
        }
    );
app.route('/courses/:id/courseEvaluations')
    .get(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const courseEvaluations = await model.EvaluatedCourse.findManyByCourseId(req.params.id);
            res.setRole(ROLE_ADMIN).sendWithRole(courseEvaluations);
        }
    );
app.route('/courses/:id/courseEvaluations/:enrollee')
    .get(
        param('id').isInt().toInt(),
        param('enrollee').isInt().toInt(),
        validate,
        async (req, res) => {
            const courseEvaluation = await model.EvaluatedCourse.findByCourseIdAndEnrolleeId(req.params.id, req.params.enrollee);
            res.setRole(ROLE_ADMIN).sendWithRole(courseEvaluation);
        }
    );
app.route('/courses/:id/enrollments')
    .get(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const enrollments = await model.Enrollment.findManyByCourseId(req.params.id);
            res.setRole(ROLE_ADMIN).sendWithRole(enrollments);
        }
    )
    .post(
        param('id').isInt().toInt(),
        body('name').isString(),
        body('email').optional().isEmail(),
        body('metadata').optional().isString(),
        validate,
        async (req, res) => {
            const enrollmentId = await model.Enrollment.create(req.params.id, req.body);
            if (enrollmentId == undefined) {
                res.sendStatus(500);
            } else {
                res.status(201).set('Location', `/enrollments/${enrollmentId}`).json({id:enrollmentId});
            }
        }
    );
app.route('/courses/:id/scale')
    .get(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const scale = await model.Scale.findByCourseId(req.params.id);
            res.setRole(ROLE_ADMIN).sendWithRole(scale);
        }
    )
    .put(
        param('id').isInt().toInt(),
        body('marks').isArray(),
        body('marks.*.score').custom(isJSONNumber),
        body('marks.*.mark').isString(),
        body('marks.*.grade_point').custom(isJSONNumber),
        validate,
        async (req, res) => {
            const result = await model.Scale.update(req.params.id, req.body);
            res.sendStatus(result ? 204 : 500);
        }
    );
app.route('/courses/:id/weights')
    .get(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const weights = await model.Weight.findManyByCourseId(req.params.id);
            res.setRole(ROLE_ADMIN).sendWithRole(weights);
        }
    )
    .post(
        param('id').isInt().toInt(),
        body('name').isString(),
        body('weight').custom(isJSONNumber),
        body('expected_max_score').custom(isJSONNumber),
        body('drop_n').custom(isJSONInteger),
        validate,
        async (req, res) => {
            const weightId = await model.Weight.create(req.params.id, req.body);
            if (weightId == undefined) {
                res.sendStatus(500);
            } else {
                res.status(201).set('Location', `/weights/${id}`).json({id:weightId});
            }
        }
    );
app.route('/enrollments/:id')
    .get(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const enrollment = await model.Enrollment.findById(req.params.id);
            if (enrollment == undefined) {
                res.sendStatus(404);
            } else {
                res.setRole(ROLE_ADMIN).sendWithRole(enrollment);
            }
        }
    )
    .put(
        param('id').isInt().toInt(),
        body('name').isString(),
        body('email').isEmail(),
        body('metadata').optional().isString(),
        validate,
        async (req, res) => {
            const result = await model.Enrollment.update(req.params.id, req.body);
            res.sendStatus(result ? 204 : 500);
        }
    )
    .delete(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const result = await model.Enrollment.delete(req.params.id);
            res.sendStatus(result ? 204 : 500);
        }
    );
app.route('/enrollments/:id/getLink')
    .post(
        async (req, res) => {
            res.sendStatus(404);
        }
    );
app.route('/weights/:id')
    .get(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const weight = await model.Weight.findById(req.params.id);
            if (weight == undefined) {
                res.sendStatus(404);
            } else {
                res.setRole(ROLE_ADMIN).sendWithRole(weight);
            }
        }
    )
    .put(
        param('id').isInt().toInt(),
        body('name').isString(),
        body('weight').custom(isJSONNumber),
        body('expected_max_score').custom(isJSONNumber),
        body('drop_n').custom(isJSONInteger),
        validate,
        async (req, res) => {
            const result = await model.Weight.update(req.params.id, req.body);
            res.sendStatus(result ? 204 : 500);
        }
    )
    .delete(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const result = await model.Weight.delete(req.params.id);
            res.sendStatus(result ? 204 : 500);
        }
    );
app.route('/weights/:id/weightEvaluations')
    .get(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const evaluatedWeights = await model.EvaluatedWeight.findManyByWeightId(req.params.id);
            res.setRole(ROLE_ADMIN).sendWithRole(evaluatedWeights);
        }
    );
app.route('/weights/:id/weightEvaluations/:enrollee')
    .get(
        param('id').isInt().toInt(),
        param('enrollee').isInt().toInt(),
        validate,
        async (req, res) => {
            const evaluatedWeight = await model.EvaluatedWeight.findByWeightIdAndEnrolleeId(req.params.id, req.params.enrollee);
            if (evaluatedWeight == undefined) {
                res.sendStatus(404);
            } else {
                res.setRole(ROLE_ADMIN).sendWithRole(evaluatedWeight);
            }
        }
    );
app.route('/weights/:id/assignments')
    .get(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const assignments = await model.Assignment.findByWeight(req.params.id);
            res.setRole(ROLE_ADMIN).sendWithRole(assignments);
        }
    )
    .post(
        param('id').isInt().toInt(),
        body('name').isString(),
        body('max_score').custom(isJSONNumber),
        validate,
        async (req, res) => {
            const assignmentId = await model.Assignment.create(req.params.id, req.body);
            if (result == undefined) {
                res.sendStatus(404);
            } else {
                res.status(201).set('Location', `/assignments/${assignmentId}`).json({id:assignmentId});
            }
        }
    );

app.route('/assignments/:id')
    .get(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const assignment = await model.Assignment.findById(req.params.id);
            if (assignment == undefined) {
                res.sendStatus(404);
            } else {
                res.setRole(ROLE_ADMIN).sendWithRole(assignment);
            }
        }
    )
    .put(
        param('id').isInt().toInt(),
        body('name').isString(),
        body('max_score').custom(isJSONNumber),
        validate,
        async (req, res) => {
            const result = await model.Assignment.update(req.params.id);
            res.sendStatus(result ? 204 : 500);
        }
    )
    .delete(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const result = await model.Assignment.delete(req.params.id);
            res.sendStatus(result ? 204 : 500);
        }
    );
app.route('/assignments/:id/evaluations')
    .get(
        param('id').isInt().toInt(),
        validate,
        async (req, res) => {
            const evaluations = await model.Evaluation.findManyByAssignmentId(req.params.id);
            res.setRole(ROLE_ADMIN).sendWithRole(evaluations);
        }
    );
app.route('/assignments/:id/evaluations/:enrollee')
    .get(
        param('id').isInt().toInt(),
        param('enrollee').isInt().toInt(),
        validate,
        async (req, res) => {
            const evaluation = await model.Evaluation.findByAssignmentIdAndEnrolleeId(req.params.id, req.params.enrollee);
            if (evaluation == undefined) {
                res.sendStatus(404);
            } else {
                res.setRole(ROLE_ADMIN).sendWithRole(evaluation);
            }
        }
    )
    .put(
        param('id').isInt().toInt(),
        param('enrollee').isInt().toInt(),
        body('score').custom(isJSONNumber),
        body('evaluated').custom(isJSONNumber),
        validate,
        async (req, res) => {
            const result = await model.Evaluation.put(req.params.id, req.params.enrollee, req.body);
            res.sendStatus(result ? 204 : 500);
        }
    )
    .delete(
        param('id').isInt().toInt(),
        param('enrollee').isInt().toInt(),
        validate,
        async (req, res) => {
            const result = await model.Evaluation.delete(req.params.id, req.params.enrollee);
            res.sendStatus(result ? 204 : 500);
        }
    );