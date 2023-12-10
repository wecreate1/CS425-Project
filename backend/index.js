import 'dotenv/config';

import * as db from './db/index.js';
import { sql } from './db/index.js';
import * as model from './model/index.js';
import express from 'express';
import cors from 'cors';
import { query, param, validationResult, body } from 'express-validator';
import { devAuthProvider } from './devAuthService/index.js';
import { auth } from 'express-oauth2-jwt-bearer';
import swagger from 'swagger-ui-dist';
import path from 'node:path';
import { fileURLToPath } from 'url';
import audit from 'express-requests-logger'
import bunyan from 'bunyan';
// import { randomUUID } from 'node:crypto';

const subject = model.subject;

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

const roles = {
    isUser: ROLE_USER,
    isStudent: ROLE_STUDENT,
    isInstructor: ROLE_INSTRUCTOR
};

function sendWithRole(res, role, val) {
    if (role == ROLE_INVALID) {
        res.sendStatus(400);
    } else if (Array.isArray(val)) {
        if (role == ROLE_ADMIN) {
            res.json(val.map(obj => obj.forAdmin()));
        } else if (role == ROLE_USER) {
            res.json(val.map(obj => obj.forUser()));
        } else if (role == ROLE_STUDENT) {
            res.json(val.map(obj => obj.forStudent()));
        } else if (role == ROLE_INSTRUCTOR) {
            res.json(val.map(obj => obj.forInstructor()));
        }
    } else if (val == undefined) {
        res.sendStatus(404);
    } else {
        if (role == ROLE_ADMIN) {
            res.json(val.forAdmin());
        } else if (role == ROLE_USER) {
            res.json(val.forUser());
        } else if (role == ROLE_STUDENT) {
            res.json(val.forStudent());
        } else if (role == ROLE_INSTRUCTOR) {
            res.json(val.forInstructor());
        } else {
            res.sendStatus(500);
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
app.listen(3000);

// app.use(express.urlencoded())
// app.use(audit());

app.use('/api', express.json());
app.use('/api', roleMw);
app.use('/api', cors({origin: ['http://localhost:3000','http://localhost:4200'], optionsSuccessStatus: 200}));
app.use('/api', auth({authRequired:true}));

app.use('/swagger.yml', express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'swagger.yml')));
app.use('/swagger/index.html', express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'swagger.html')));
app.get('/swagger/', (req, res) => res.redirect('/swagger/index.html'));
app.use('/swagger/', express.static(swagger.absolutePath()));

app.use('/oidc', devAuthProvider);

// app.route('/api/v1/users')
//     .get(
//         async (req, res) => {
//             res.sendStatus(403);
//         }
//     )
//     .post(
//         body('name').isString(),
//         validate,
//         async (req, res) => {
//             const id = await model.User.create(req.body);
//             if (id == undefined) {
//                 res.sendStatus(500);
//             } else {
//                 res.status(201).set('Location', `/api/v1/users/${id}`).json({id});
//             }
//         }
//     )
app.route('/api/v1/users/me')
    .get(async (req, res) => {
        const user = await model.User.findBySubject(req.auth.payload.sub);
        if (user == undefined) {
            res.json({userCreationRequired: true});
        } else {
            res.setRole(ROLE_USER).sendWithRole(user);
        }
    })
    .post(
        body('name').isString(),
        validate,
        async (req, res) => {
            const userId = await model.User.createWithSubject(req.auth.payload.sub, req.body);
            if (userId == undefined) {
                res.sendStatus(500);
            } else {
                res.status(201).set('Location', `/api/v1/users/${userId}`).json({id:userId});
            }
        }
    )
app.route('/api/v1/users/:id')
    .get(
        param('id').isInt().toInt(),
        validate,
        subject.isUser(),
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
        subject.isUser(),
        async (req, res) => {
            const result = await model.User.update(req.params.id, req.body);
            res.sendStatus(result ? 204 : 500);
        }
    )
    .delete(
        param('id').isInt().toInt(),
        validate,
        subject.isUser(),
        async (req, res) => {
            const result = await model.User.delete(req.params.id);
            res.sendStatus(result ? 204 : 500);
        }
    );
app.route('/api/v1/users/:id/enrollments')
    .get(
        param('id').isInt().toInt(),
        validate,
        subject.isUser(),
        async (req, res) => {
            // should return both enrollment and course info
            const enrollments = await model.Enrollment.findManyByStudentId(req.params.id, true);
            res.setRole(ROLE_STUDENT).sendWithRole(enrollments);
        }
    );
app.route('/api/v1/users/:id/enrollments/link')
    .post(
        param('id').isInt().toInt(),
        body('token').isUUID(),
        validate,
        subject.isUser(),
        async (req, res) => {
            const enrollment = model.EnrollmentUserLinkToken.perform(req.body.token, req.params.id);
            if (enrollment == undefined) {
                res.sendStatus(500);
            } else {
                res.status(201).set('Location', `/api/v1/enrollments/${enrollment}`).json({id:enrollment});
            }
        }
    );
app.route('/api/v1/users/:id/instructs')
    .get(
        param('id').isInt().toInt(),
        validate,
        subject.isUser(),
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
        subject.isUser(),
        async (req, res) => {
            const courseId = await model.Course.create(req.body);
            if (courseId == undefined) {
                res.sendStatus(500);
                return;
            }
            const result = await model.Instructs.create(courseId, req.params.id);
            if (!result) {
                model.Course.delete(courseId);
                res.sendStatus(500);
                return
            }
            res.status(201).set('Location', `/api/v1/courses/${courseId}`).json({id:courseId});
        }
    );
app.route('/api/v1/courses/:id')
    .get(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOrStudentOfCourse(),
        async (req, res) => {
            const course = await model.Course.findById(req.params.id);
            res.setRole(roles[req.subject]).sendWithRole(course);
        }
    )
    .put(
        param('id').isInt().toInt(),
        body('name').isString(),
        body('credits').custom(isJSONNumber),
        validate,
        subject.isInstructorOfCourse(),
        async (req, res) => {
            const result = await model.Course.update(req.params.id, req.body);
            res.sendStatus(result ? 204 : 500);
        }
    )
    .delete(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOfCourse(),
        async (req, res) => {
            const result = await model.Course.delete(req.params.id);
            res.sendStatus(result ? 204 : 500);
        }
    );
app.route('/api/v1/courses/:id/courseEvaluations')
    .get(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOfCourse(),
        async (req, res) => {
            const courseEvaluations = await model.EvaluatedCourse.findManyByCourseId(req.params.id);
            res.setRole(ROLE_INSTRUCTOR).sendWithRole(courseEvaluations);
        }
    );
app.route('/api/v1/courses/:id/courseEvaluations/:enrollee')
    .get(
        param('id').isInt().toInt(),
        param('enrollee').isInt().toInt(),
        validate,
        subject.isInstructorOrStudentOfEnrollment('enrollee'),
        async (req, res) => {
            const courseEvaluation = await model.EvaluatedCourse.findByCourseIdAndEnrolleeId(req.params.id, req.params.enrollee);
            if (courseEvaluation == undefined) {
                res.sendStatus(404);
            } else {
                res.setRole(roles[req.subject]).sendWithRole(courseEvaluation);
            }
        }
    );
app.route('/api/v1/courses/:id/enrollments')
    .get(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOfCourse(),
        async (req, res) => {
            const enrollments = await model.Enrollment.findManyByCourseId(req.params.id);
            res.setRole(ROLE_INSTRUCTOR).sendWithRole(enrollments);
        }
    )
    .post(
        param('id').isInt().toInt(),
        body('name').isString(),
        body('email').optional().isString(),
        body('metadata').optional().isString(),
        subject.isInstructorOfCourse(),
        validate,
        async (req, res) => {
            const enrollmentId = await model.Enrollment.create(req.params.id, req.body);
            if (enrollmentId == undefined) {
                res.sendStatus(500);
            } else {
                res.status(201).set('Location', `/api/v1/enrollments/${enrollmentId}`).json({id:enrollmentId});
            }
        }
    );
app.route('/api/v1/courses/:id/scale')
    .get(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOrStudentOfCourse(),
        async (req, res) => {
            const scale = await model.Scale.findByCourseId(req.params.id);
            res.setRole(roles[req.subject]).sendWithRole(scale);
        }
    )
    .put(
        param('id').isInt().toInt(),
        body('marks').isArray(),
        body('marks.*.score').custom(isJSONNumber),
        body('marks.*.mark').isString(),
        body('marks.*.grade_point').custom(isJSONNumber),
        validate,
        subject.isInstructorOfCourse(),
        async (req, res) => {
            const result = await model.Scale.update(req.params.id, req.body);
            res.sendStatus(result ? 204 : 500);
        }
    );
app.route('/api/v1/courses/:id/weights')
    .get(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOrStudentOfCourse(),
        async (req, res) => {
            const weights = await model.Weight.findManyByCourseId(req.params.id);
            res.setRole(roles[req.subject]).sendWithRole(weights);
        }
    )
    .post(
        param('id').isInt().toInt(),
        body('name').isString(),
        body('weight').custom(isJSONNumber),
        body('expected_max_score').custom(isJSONNumber),
        body('drop_n').custom(isJSONInteger),
        validate,
        subject.isInstructorOfCourse(),
        async (req, res) => {
            const weightId = await model.Weight.create(req.params.id, req.body);
            if (weightId == undefined) {
                res.sendStatus(500);
            } else {
                res.status(201).set('Location', `/api/v1/weights/${id}`).json({id:weightId});
            }
        }
    );
app.route('/api/v1/enrollments/:id')
    .get(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOrStudentOfEnrollment(),
        async (req, res) => {
            const enrollment = await model.Enrollment.findById(req.params.id, true);
            if (enrollment == undefined) {
                res.sendStatus(404);
            } else {
                res.setRole(roles[req.subject]).sendWithRole(enrollment);
            }
        }
    )
    .put(
        param('id').isInt().toInt(),
        body('name').isString(),
        body('email').isEmail(),
        body('metadata').optional().isString(),
        validate,
        subject.isInstructorOfEnrollment(),
        async (req, res) => {
            const result = await model.Enrollment.update(req.params.id, req.body);
            res.sendStatus(result ? 204 : 500);
        }
    )
    .delete(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOfEnrollment(),
        async (req, res) => {
            const result = await model.Enrollment.delete(req.params.id);
            res.sendStatus(result ? 204 : 500);
        }
    );
app.route('/api/v1/enrollments/:id/unlink')
    .post(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOrStudentOfEnrollment(),
        async (req, res) => {
            const result = await model.Enrollment.unlinkStudent(req.params.id);
            await model.EnrollmentUserLinkToken.cancel(req.params.id);

            res.sendStatus(result ? 204 : 500);
        }
    )
app.route('/api/v1/enrollments/:id/getLinkToken')
    .post(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOfEnrollment(),
        async (req, res) => {
            const token = await model.EnrollmentUserLinkToken.create(req.params.id);
            if (token == undefined) {
                res.sendStatus(500);
            } else {
                res.json(token);
            }
        }
    );
app.route('/api/v1/weights/:id')
    .get(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOrStudentOfWeight(),
        async (req, res) => {
            const weight = await model.Weight.findById(req.params.id);
            if (weight == undefined) {
                res.sendStatus(404);
            } else {
                res.setRole(roles[req.subject]).sendWithRole(weight);
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
        subject.isInstructorOfWeight(),
        async (req, res) => {
            const result = await model.Weight.update(req.params.id, req.body);
            res.sendStatus(result ? 204 : 500);
        }
    )
    .delete(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOfWeight(),
        async (req, res) => {
            const result = await model.Weight.delete(req.params.id);
            res.sendStatus(result ? 204 : 500);
        }
    );
app.route('/api/v1/weights/:id/weightEvaluations')
    .get(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOfWeight(),
        async (req, res) => {
            const evaluatedWeights = await model.EvaluatedWeight.findManyByWeightId(req.params.id);
            res.setRole(ROLE_INSTRUCTOR).sendWithRole(evaluatedWeights);
        }
    );
app.route('/api/v1/weights/:id/weightEvaluations/:enrollee')
    .get(
        param('id').isInt().toInt(),
        param('enrollee').isInt().toInt(),
        validate,
        subject.isInstructorOrStudentOfEnrollment('enrollee'),
        async (req, res) => {
            const evaluatedWeight = await model.EvaluatedWeight.findByWeightIdAndEnrolleeId(req.params.id, req.params.enrollee);
            if (evaluatedWeight == undefined) {
                res.sendStatus(404);
            } else {
                res.setRole(roles[req.subject]).sendWithRole(evaluatedWeight);
            }
        }
    );
app.route('/api/v1/weights/:id/assignments')
    .get(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOrStudentOfWeight(),
        async (req, res) => {
            const assignments = await model.Assignment.findByWeight(req.params.id);
            res.setRole(roles[req.subject]).sendWithRole(assignments);
        }
    )
    .post(
        param('id').isInt().toInt(),
        body('name').isString(),
        body('max_score').custom(isJSONNumber),
        validate,
        subject.isInstructorOfWeight(),
        async (req, res) => {
            const assignmentId = await model.Assignment.create(req.params.id, req.body);
            if (result == undefined) {
                res.sendStatus(404);
            } else {
                res.status(201).set('Location', `/api/v1/assignments/${assignmentId}`).json({id:assignmentId});
            }
        }
    );

app.route('/api/v1/assignments/:id')
    .get(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOrStudentOfAssignment(),
        async (req, res) => {
            const assignment = await model.Assignment.findById(req.params.id);
            if (assignment == undefined) {
                res.sendStatus(404);
            } else {
                res.setRole(roles[res.subject]).sendWithRole(assignment);
            }
        }
    )
    .put(
        param('id').isInt().toInt(),
        body('name').isString(),
        body('max_score').custom(isJSONNumber),
        validate,
        subject.isInstructorOfAssignment(),
        async (req, res) => {
            const result = await model.Assignment.update(req.params.id);
            res.sendStatus(result ? 204 : 500);
        }
    )
    .delete(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOfAssignment(),
        async (req, res) => {
            const result = await model.Assignment.delete(req.params.id);
            res.sendStatus(result ? 204 : 500);
        }
    );
app.route('/api/v1/assignments/:id/evaluations')
    .get(
        param('id').isInt().toInt(),
        validate,
        subject.isInstructorOfAssignment(),
        async (req, res) => {
            const evaluations = await model.Evaluation.findManyByAssignmentId(req.params.id);
            res.setRole(ROLE_INSTRUCTOR).sendWithRole(evaluations);
        }
    );
app.route('/api/v1/assignments/:id/evaluations/:enrollee')
    .get(
        param('id').isInt().toInt(),
        param('enrollee').isInt().toInt(),
        validate,
        subject.isInstructorOrStudentOfEnrollment('enrollee'),
        async (req, res) => {
            const evaluation = await model.Evaluation.findByAssignmentIdAndEnrolleeId(req.params.id, req.params.enrollee);
            if (evaluation == undefined) {
                res.sendStatus(404);
            } else {
                res.setRole(roles[req.subject]).sendWithRole(evaluation);
            }
        }
    )
    .put(
        param('id').isInt().toInt(),
        param('enrollee').isInt().toInt(),
        body('score').custom(isJSONNumber),
        body('evaluated').custom(isJSONNumber),
        validate,
        subject.isInstructorOfAssignment('id'),
        async (req, res) => {
            const result = await model.Evaluation.put(req.params.id, req.params.enrollee, req.body);
            res.sendStatus(result ? 204 : 500);
        }
    )
    .delete(
        param('id').isInt().toInt(),
        param('enrollee').isInt().toInt(),
        validate,
        subject.isInstructorOfAssignment('id'),
        async (req, res) => {
            const result = await model.Evaluation.delete(req.params.id, req.params.enrollee);
            res.sendStatus(result ? 204 : 500);
        }
    );