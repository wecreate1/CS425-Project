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

function isJSONNumber(val) {
    return typeof val == 'number' && isFinite(val);
}

const app = express();

app.use(express.json());
app.use(roleMw);

app.route('/users')
    .get(

    )
    .post(

    )
app.route('/users/:id')
    .get(

    )
    .post(

    )
    .delete(

    );
app.route('/users/:id/enrollments')
    .get(

    );
app.route('/users/:id/enrollments/link')
    .get(

    );
app.route('/users/:id/instructs')
    .get(

    )
    .post(

    );
app.route('/courses/:id')
    .get(

    )
    .put(

    )
    .delete(

    );
app.route('/courses/:id/courseEvaluations')
    .get(

    );
app.route('/courses/:id/courseEvaluations/:enrollee')
    .get(

    );
app.route('/courses/:id/enrollments')
    .get(

    )
    .post(

    );
app.route('/courses/:id/scale')
    .get(

    )
    .put(

    );
app.route('/courses/:id/weights')
    .get(

    )
    .post(

    );
app.route('/enrollments/:id')
    .get(

    )
    .put(

    )
    .delete(

    );
app.route('/enrollments/:id/getLink')
    .post(

    );
app.route('/weights/:id')
    .get(

    )
    .put(

    )
    .delete(

    );
app.route('/weights/:id/weightEvaluations')
    .get(

    );
app.route('/weights/:id/weightEvaluations/:enrollee')
    .get(

    );
app.route('/weights/:id/assignments')
    .get(

    )
    .post(

    );

app.route('/assignments/:id')
    .get(
        
    )
    .put(

    )
    .delete(

    );
app.route('/assignments/:id/evaluations')
    .get(

    )
    .post(

    );
app.route('/assignments/:id/evaluations/:enrollee')
    .get(

    )
    .put(

    )
    .delete(
        
    );