import * as db from '../db/index.js';
import { sql } from '../db/index.js';
import * as pg_format from 'pg-format';

// class Claim

export class Subject {
    constructor(sub) {
        this.sub = sub;
    }

    static wrapper(funcName) {
        return (idParam = 'id') =>
            async (req, res, next) => {
                const result = await (new Subject(req.auth.payload.sub))[funcName](req.params[idParam])
                if (result) {
                    req.subject = result;
                    next();
                } else {
                    res.sendStatus(403);
                }
            };
    }

    async isUser(id) {
        const result = await db.query(sql`
            SELECT 1
            FROM OIDCSubject
            WHERE sub=${this.sub} AND user_id=${id};
        `);

        return result.rows.length == 1 ? 'isUser' : undefined;
    }

    async isStudentOfCourse(id) {
        const result = await db.query(sql`
            SELECT 1
            FROM Enrollments INNER JOIN OIDCSubject ON Enrollments.student_id=OIDCSubject.user_id
            WHERE Enrollments.course_id=${id} AND OIDCSubject.sub=${this.sub};
        `);

        return result.rows.length == 1 ? 'isStudent' : undefined;
    }

    async isInstructorOfCourse(id) {
        const result = await db.query(sql`
            SELECT 1
            FROM Instructs INNER JOIN OIDCSubject ON Instructs.instructor_id=OIDCSubject.user_id
            WHERE Instructs.course_id=${id} AND OIDCSubject.sub=${this.sub};
        `);
        return result.rows.length == 1 ? 'isInstructor' : undefined;
    }

    async isInstructorOrStudentOfCourse(id) {
        return await this.isStudentOfCourse(id) || await this.isInstructorOfCourse(id);
    }

    async isInstructorOfEnrollment(id) {
        const result = await db.query(sql`
            SELECT 1
            FROM Enrollments
                INNER JOIN Instructs ON Enrollments.course_id=Instructs.course_id
                INNER JOIN OIDCSubject ON Instructs.instructor_id=OIDCSubject.user_id
            WHERE Enrollments.id=${id} AND OIDCSubject.sub=${this.sub}
        `);

        return result.rows.length == 1 ? 'isInstructor' : undefined;
    }

    async isStudentOfEnrollment(id) {
        const result = await db.query(sql`
            SELECT 1
            FROM Enrollments INNER JOIN OIDCSubject ON Enrollments.student_id=OIDCSubject.user_id
            WHERE Enrollments.id=${id} AND OIDCSubject.sub=${this.sub};
        `);

        return result.rows.length == 1 ? 'isStudent' : undefined;
    }

    async isInstructorOrStudentOfEnrollment(id) {
        return await this.isInstructorOfEnrollment(id) || await this.isStudentOfEnrollment(id);
    }

    async isInstructorOfWeight(id) {
        const result = await db.query(sql`
            SELECT 1
            FROM Weights
                INNER JOIN Instructs ON Weights.course_id=Instructs.course_id
                INNER JOIN OIDCSubject ON Instructs.instructor_id=OIDCSubject.user_id
            WHERE Weights.id=${id} AND OIDCSubject.sub=${this.sub}
        `);

        return result.rows.length == 1 ? 'isInstructor' : undefined;
    }

    async isStudentOfWeight(id) {
        const result = await db.query(sql`
            SELECT 1
            FROM Weights
                INNER JOIN Enrollments ON Weights.course_id=Enrollments.course_id
                INNER JOIN ON OIDCSubject ON Enrollments.student_id=OIDCSubject=${user_id}
            WHERE Weights.id=${id} AND OIDCSubject.sub=${this.sub};
        `);

        return result.rows.length == 1 ? 'isStudent' : undefined;
    }

    async isInstructorOrStudentOfWeight(id) {
        return await this.isInstructorOfWeight(id) || await this.isStudentOfWeight(id);
    }

    async isInstructorOfAssignment(id) {
        const result = await db.query(sql`
            SELECT 1
            FROM Assignments
                INNER JOIN Weights ON Assignments.weight_id=Weights.id
                INNER JOIN Instructs ON Weights.course_id=Instructs.course_id
                INNER JOIN OIDCSubject ON Instructs.instructor_id=OIDCSubject.user_id
            WHERE Assignments.id=${id} AND OIDCSubject.sub=${this.sub}
        `);

        return result.rows.length == 1 ? 'isInstructor' : undefined;
    }

    async isStudentOfAssignment(id) {
        const result = await db.query(sql`
            SELECT 1
            FROM Assignments
                INNER JOIN Weights ON Assignments.weight_id=Weights.id
                INNER JOIN Enrollments ON Weights.course_id=Enrollments.course_id
                INNER JOIN ON OIDCSubject ON Enrollments.student_id=OIDCSubject=${user_id}
            WHERE Assignments.id=${id} AND OIDCSubject.sub=${this.sub};
        `);

        return result.rows.length == 1 ? 'isStudent' : undefined;
    }

    async isInstructorOrStudentOfAssignment(id) {
        return await this.isInstructorOfAssignment(id) || await this.isStudentOfAssignment(id);
    }
}

export const subject = {
    isUser: Subject.wrapper('isUser'),
    isStudentOfCourse: Subject.wrapper('isStudentOfCourse'),
    isInstructorOfCourse: Subject.wrapper('isInstructorOfCourse'),
    isInstructorOrStudentOfCourse: Subject.wrapper('isInstructorOrStudentOfCourse'),
    isInstructorOfEnrollment: Subject.wrapper('isInstructorOfEnrollment'),
    isStudentOfEnrollment: Subject.wrapper('isStudentOfEnrollment'),
    isInstructorOrStudentOfEnrollment: Subject.wrapper('isInstructorOrStudentOfEnrollment'),
    isInstructorOfWeight: Subject.wrapper('isInstructorOfWeight'),
    isStudentOfWeight: Subject.wrapper('isStudentOfWeight'),
    isInstructorOrStudentOfWeight: Subject.wrapper('isInstructorOrStudentOfWeight'),
    isInstructorOfAssignment: Subject.wrapper('isInstructorOfAssignment'),
    isStudentOfAssignment: Subject.wrapper('isStudentOfAssignment'),
    isInstructorOrStudentOfAssignment: Subject.wrapper('isInstructorOrStudentOfAssignment'),
};

export class User {
    constructor(obj) {
        ({id: this.id, name: this.name} = obj);
    }

    static async findById(id) {
        const result = await db.query(sql`
            SELECT id, name
            FROM Users
            WHERE id=${id};
        `);

        if (result.rows.length == 1) {
            return new User(result.rows[0]);
        }
    }

    static async findAll(id) {
        const result = await db.query(sql`
            SELECT id, name
            FROM Users;
        `);

        return result.rows.map((obj) => new User(obj));
    }

    static async findBySubject(sub) {
        const result = await db.query(sql`
            SELECT Users.id, Users.name
            FROM Users INNER JOIN OIDCSubject ON Users.id=OIDCSubject.user_id
            WHERE OIDCSubject.sub=${sub};
        `);

        if (result.rows.length == 1) {
            return new User(result.rows[0]);
        }
    }

    static async createWithSubject(sub, obj) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            const userId = await db.query(sql`
                INSERT INTO Users (name)
                VALUES (${obj.name})
                RETURNING id;
            `);

            if (userId.rows.length != 1) {
                throw null;
            }

            const result = await db.query(sql`
                INSERT INTO OIDCSubject (sub, user_id)
                VALUES (${sub}, ${userId.rows[0].id});
            `);

            if (result.rowCount != 1) {
                throw null;
            }

            await client.query('COMMIT');

            return userId.rows[0].id;
        } catch (e) {
            await client.query('ROLLBACK');
        } finally {
            client.release();
        }

    }

    static async update(id, obj) {
        const result = await db.query(sql`
            UPDATE Users
            SET name=${obj.name}
            WHERE id=${id}
        `);

        return result.rowCount == 1;
    }

    static async delete(id) {
        const result = await db.query(sql`
            DELETE FROM Users
            WHERE id=${id};
        `);

        return result.rowCount == 1;
    }

    forUser() {
        return {id: this.id, name: this.name};
    }
}

export class Course {
    constructor(obj) {
        ({id: this.id, name: this.name, credits: this.credits} = obj);
    }

    static async findById(id) {
        const result = await db.query(sql`
            SELECT id, name, credits
            FROM Courses
            WHERE id=${id};
        `);

        if (result.rows.length == 1) {
            return new Course(result.rows[0]);
        }
    }

    static async findAll(id) {
        const result = await db.query(sql`
            SELECT id, name, credits
            FROM Courses;
        `);

        return result.rows.map((obj) => new Course(obj));
    }

    static async findManyByStudentId(studentId) {
        const result = await db.query(sql`
            SELECT Courses.id, Courses.name, Courses.credits
            FROM Courses INNER JOIN Enrollments ON Courses.id=Enrollments.course_id
            WHERE student_id=${studentId};
        `);
    
        return result.rows.map((obj) => new Course(obj));
    }

    static async findManyByInstructorId(instructorId) {
        const result = await db.query(sql`
            SELECT Courses.id, Courses.name, Courses.credits
            FROM Courses INNER JOIN Instructs ON Courses.id=Instructs.course_id
            WHERE instructor_id=${instructorId};
        `);
    
        return result.rows.map((obj) => new Course(obj));
    }

    static async create(obj) {
        const result = await db.query(sql`
            INSERT INTO Courses (name, credits)
            VALUES (${obj.name}, ${obj.credits})
            RETURNING id;
        `)

        if (result.rows.length  == 1) {
            return result.rows[0].id;
        }
    }

    static async update(id, obj) {
        const result = await db.query(sql`
            UPDATE Courses
            SET name=${obj.name}, credits=${obj.credits}
            WHERE id=${id}
        `);

        return result.rowCount == 1;
    }

    static async delete(id) {
        const result = await db.query(sql`
            DELETE FROM Courses
            WHERE id=${id};
        `);

        return result.rowCount == 1;
    }

    forStudent() {
        return {id: this.id, name: this.name, credits: this.credits};
    }

    forInstructor() {
        return {id: this.id, name: this.name, credits: this.credits};
    }

    forAdmin() {
        return {id: this.id, name: this.name, credits: this.credits};
    }
}

export class Scale {
    constructor(marks) {
        this.marks = marks.map((obj) => {
            const { score, mark, grade_point } = obj;
            return { score, mark, grade_point };
        })
        
    }

    static async findByCourseId(courseId) {
        const result = await db.query(sql`
            SELECT score, mark, grade_point
            FROM ScaleMarks
            WHERE course=${courseId}
            ORDER BY score;
        `);

        return new Scale(result.rows);
    }

    static async update(courseId, obj) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            await client.query(sql`
                DELETE FROM ScaleMarks
                WHERE course_id=${courseId};
            `);
            let marks_list = [];
            if (obj.marks != undefined) {
                for (const mark of obj.marks) {
                    marks_list.push([courseId, obj.score, obj.mark, obj.grade_point])
                }
            }
            await client.query(pg_format('INSERT INTO ScaleMarks (course_id, score, mark, grade_point) VALUES %L;', marks_list));
            await client.query('COMMIT');
            return true;
        } catch (e) {
            await db.query('ROLLBACK');
            return false;
        } finally {
            client.release();
        }
        return true;
    }

    static async delete(courseId) {
        await db.query(sql`
            DELETE FROM ScaleMarks
            WHERE course=${courseId};
        `)

        return true;
    }

    forStudent() {
        return {marks: this.marks};
    }

    forInstructor() {
        return {marks: this.marks};
    }

    forAdmin() {
        return {marks: this.marks};
    }
}

export class Enrollment {
    constructor(obj) {
        ({id: this.id, course_id: this.course_id, student_id: this.student_id, name: this.name, email: this.email, metadata: this.metadata} = obj)
        if (obj.course_name != undefined) {
            this.course = new Course({id:obj.course_id, name:obj.course_name, credits:obj.course_credits});
        };
    }

    get isLinked() {
        return this.student_id != null;
    }

    static async findById(id, withCourse=false) {
        let result;
        if (withCourse) {
            result = await db.query(sql`
                SELECT Enrollments.id,
                       Enrollments.course_id,
                       Enrollments.student_id,
                       Enrollments.name,
                       Enrollments.email,
                       Enrollments.metadata,
                       Courses.name AS course_name,
                       Courses.credits AS course_credits
                FROM Enrollments INNER JOIN Courses ON Enrollments.course_id=Courses.id
                WHERE Enrollments.id=${id};
            `);
        } else {
            result = await db.query(sql`
                SELECT Enrollments.id,
                    Enrollments.course_id,
                    Enrollments.student_id,
                    Enrollments.name,
                    Enrollments.email,
                    Enrollments.metadata
                FROM Enrollments
                WHERE id=${id};
            `);
        }

        if (result.rows.length == 1) {
            return new Enrollment(result.rows[0]);
        }
    }

    static async findManyByStudentId(studentId, withCourse=false) {
        const result = await db.query(sql`
            SELECT Enrollments.id, Enrollments.course_id, Enrollments.student_id, Enrollments.name, Enrollments.email, Enrollments.metadata
            FROM Enrollments
            WHERE student_id=${studentId};
        `);
    
        return result.rows.map((obj) => new Enrollment(obj));
    }

    static async findManyByCourseId(courseId) {
        const result = await db.query(sql`
            SELECT Enrollments.id, Enrollments.course_id, Enrollments.student_id, Enrollments.name, Enrollments.email, Enrollments.metadata
            FROM Enrollments
            WHERE course_id=${courseId};
        `);
    
        return result.rows.map((obj) => new Enrollment(obj));
    }

    static async findAll(id) {
        const result = await db.query(sql`
            SELECT Enrollments.id, Enrollments.course_id, Enrollments.student_id, Enrollments.name, Enrollments.email, Enrollments.metadata
            FROM Enrollments;
        `);

        return result.rows.map((obj) => new Enrollment(obj));
    }

    static async create(courseId, obj) {
        const result = await db.query(sql`
            INSERT INTO Enrollments (course_id, name, email, metadata)
            VALUES (${courseId}, ${obj.name}, ${obj.email}, ${obj.metadata})
            RETURNING id;
        `)

        if (result.rows.length  == 1) {
            return result.rows[0].id;
        }
    }

    static async update(id, obj) {
        const result = await db.query(sql`
            UPDATE Enrollments
            SET name=${obj.name}, email=${obj.email}, metadata=${obj.metadata}
            WHERE id=${id}
        `);

        return result.rowCount == 1;
    }

    static async delete(id) {
        const result = await db.query(sql`
            DELETE FROM Enrollments
            WHERE id=${id};
        `);

        return result.rowCount == 1;
    }

    // static async linkStudent(id, studentId) {
    //     const result = await db.query(sql`
    //         UPDATE Enrollments
    //         SET student_id=${studentId}
    //         WHERE id=${id};
    //     `);

    //     return result.rowCount == 1;
    // }

    static async unlinkStudent(id) {
        const result = await db.query(sql`
            UPDATE Enrollments
            SET student_id=NULL
            WHERE id=${id};
        `);

        return result.rowCount == 1;
    }

    forStudent() {
        return {id: this.id, course_id: this.course_id, course: this.course ? this.course.forStudent() : undefined, student_id: this.student_id, name: this.name};
    }

    forInstructor() {
        return {id: this.id, course_id: this.course_id, course: this.course ? this.course.forInstructor() : undefined, isLinked: this.isLinked, name: this.name, email: this.email, metadata: this.metadata};
    }

    forAdmin() {
        return {id: this.id, course_id: this.course_id, course: this.course ? this.course.forAdmin() : undefined, student_id: this.student_id, isLinked: this.isLinked, name: this.name, email: this.email, metadata: this.metadata};
    }
}

export class Instructs {
    constructor(obj) {
        ({course_id: this.course_id, instructor_id: this.instructor_id} = obj);
    }

    static async findManyByCourseId(courseId) { // just in case we end up supporting multiple instructors per course
        const result = await db.query(sql`
            SELECT course_id, instructor_id
            FROM Instructs
            WHERE course_id=${courseId};
        `);

        return result.rows.map(obj => new Instructs(obj));
    }

    static async findManyByInstructorId(instructorId) {
        const result = await db.query(sql`
            SELECT course_id, instructor_id
            FROM Instructs
            WHERE instructor_id=${instructorId};
        `);

        return result.rows.map(obj => new Instructs(obj));
    }

    static async create(courseId, instructorId) {
        const result = await db.query(sql`
            INSERT INTO Instructs (course_id, instructor_id)
            VALUES (${courseId}, ${instructorId});
        `)

        return true;
    }

    static async delete(courseId, instructorId) {
        const result = await db.query(sql`
            DELETE FROM Instructs
            WHERE course_id=${courseId}, instructor_id=${instructorId};
        `);

        return result.rowCount == 1;
    }

    forInstructor() {
        return {course_id: this.course_id, instructor_id: this.instructor_id};
    }

    forAdmin() {
        return {course_id: this.course_id, instructor_id: this.instructor_id};
    }
}

export class Weight {
    constructor(obj) {
        ({id: this.id, course_id: this.course_id, name: this.name, weight: this.weight, expected_max_score: this.expected_max_score, drop_n: this.drop_n, current_max_score: this.current_max_score} = obj);
    }

    static async findById(id) {
        const result = await db.query(sql`
            SELECT id, course_id, name, weight, expected_max_score, drop_n, current_max_score
            FROM WeightsExtended
            WHERE id=${id};
        `);

        if (result.rows.length == 1) {
            return new Weight(result.rows[0]);
        }
    }

    static async findManyByCourseId(courseId) {
        const result = await db.query(sql`
            SELECT id, course_id, name, weight, expected_max_score, drop_n, current_max_score
            FROM WeightsExtended
            WHERE course=${courseId};
        `);

        return result.rows.map(obj => new Weight(obj));
    }

    static async findAll() {
        const result = await db.query(sql`
            SELECT id, course_id, name, weight, expected_max_score, drop_n, current_max_score
            FROM WeightsExtended;
        `);

        return result.rows.map(obj => new Weight(obj));
    }

    static async create(courseId, obj) {
        const result = await db.query(sql`
            INSERT INTO Weights (course_id, name, weight, expected_max_score, drop_n)
            VALUES (${courseId}, ${obj.name}, ${obj.weight}, ${obj.expected_max_score}, ${obj.drop_n})
            RETURNING id;
        `);

        if (result.rows.length == 1) {
            return result.rows[0].id;
        }
    }

    static async update(id, obj) {
        const result = await db.query(sql`
            UPDATE Weights
            SET name=${obj.name}, weight=${obj.weight}, expected_max_score=${obj.expected_max_score}, drop_n=${obj.drop_n}
            WHERE id=${id};
        `);

        return result.rowCount == 1;
    }

    static async delete(id) {
        const result = db.await(sql`
            DELETE FROM Weights
            WHERE id=${id};
        `);

        return result.rowCount == 1;
    }

    forStudent() {
        return {id: this.id, course_id: this.id, name: this.name, weight: this.weight, expected_max_score: this.expected_max_score, drop_n: this.drop_n, current_max_score: this.current_max_score};
    }

    forInstructor() {
        return {id: this.id, course_id: this.id, name: this.name, weight: this.weight, expected_max_score: this.expected_max_score, drop_n: this.drop_n, current_max_score: this.current_max_score};
    }

    forAdmin() {
        return {id: this.id, course_id: this.id, name: this.name, weight: this.weight, expected_max_score: this.expected_max_score, drop_n: this.drop_n, current_max_score: this.current_max_score};
    }
}

export class Assignment {
    constructor(obj) {
        ({id: this.id, weight_id: this.weight_id, name: this.name, max_score: this.max_score} = obj);
    }

    static async findById(id) {
        const result = await db.query(sql`
            SELECT id, weight_id, name, max_score
            FROM Assignments
            WHERE id = ${id};
        `);

        if (result.rows.length == 1) {
            return new Assignment(result.rows[0]);
        }
    }

    static async findByWeight(weightId) {
        const result = await db.query(sql`
            SELECT id, weight_id, name, max_score
            FROM Assignments
            WHERE weight_id = ${weightId};
        `);

        return result.rows.map(obj => new Assignment(obj));
    }

    static async findByCourse(courseId) {
        const result = await db.query(sql`
            SELECT Assignments.id, Assignments.weight_id, Assignments.name, Assignments.max_score
            FROM Assignments INNER JOIN Weights ON Assignments.weight_id = Weights.id
            WHERE course = ${courseId};
        `);

        return result.rows.map(obj => new Assignment(obj));
    }

    static async findAll() {
        const result = await db.query(sql`
            SELECT id, weight_id, name, max_score
            FROM Assignments;
        `);

        return result.rows.map(obj => new Assignment(obj));
    }

    static async create(weightId, obj) {
        const result = await db.query(sql`
            INSERT INTO Assignments (weight_id, name, max_score)
            VALUES (${weightId}, ${obj.name}, ${obj.max_score})
            RETURNING id;
        `);

        if (result.rows.length == 1) {
            return result.rows[0].id;
        }
    }

    static async update(id, obj) {
        const result = await db.query(sql`
            UPDATE Assignments
            SET name=${obj.name}, max_score=${ob.max_score}
            WHERE id=${id};
        `);

        return result.rowCount == 1;
    }

    static async delete(id) {
        const result = await db.query(sql`
            DELETE FROM Assignments
            WHERE id=${id};
        `);

        return result.rowCount == 1;
    }

    forStudent() {
        return {id: this.id, weight_id: this.weight_id, name: this.name, max_score: this.max_score};
    }

    forInstructor() {
        return {id: this.id, weight_id: this.weight_id, name: this.name, max_score: this.max_score};
    }

    forAdmin() {
        return {id: this.id, weight_id: this.weight_id, name: this.name, max_score: this.max_score};
    }
}

export class Evaluation {
    constructor(obj) {
        ({assignment_id: this.assignment_id, enrollee_id: this.enrollee_id, score: this.score, evaluated: this.evaluated} = obj);
    }

    static async findByAssignmentIdAndEnrolleeId(assignmentId, enrolleeId) {
        const result = await db.query(sql`
            SELECT assignment_id, enrollee_id, score, evaluated
            FROM Evaluations
            WHERE assignment_id = ${assignmentId} AND enrollee_id = ${enrolleeId};
        `);

        if (result.rows.length == 1) {
            return new Evaluation(result.rows[0]);
        }
    }

    static async findAll() {
        const result = await db.query(sql`
            SELECT assignment_id, enrollee_id, score, evaluated
            FROM Evaluations;
        `);

        return result.rows.map(obj => new Evaluation(obj));
    }

    static async findManyByAssignmentId(assignmentId) {
        const result = await db.query(sql`
            SELECT assignment_id, enrollee_id, score, evaluated
            FROM Evaluations
            WHERE assignment_id = ${assignmentId};
        `);

        return result.rows.map(obj => new Evaluation(obj));
    }

    static async findManyByEnrolleeId(enrolleeId) {
        const result = await db.query(sql`
            SELECT assignment_id, enrollee_id, score, evaluated
            FROM Evaluations
            WHERE enrollee_id = ${enrolleeId};
        `);

        return result.rows.map(obj => new Evaluation(obj));
    }

    static async put(assignmentId, enrolleeId, obj) {
        const result = await db.query(/* non-portable */ sql`
            INSERT INTO Evaluations (assignment_id, enrollee_id, score, evaluated)
            VALUES (${assignmentId}, ${enrolleeId}, ${obj.score}, ${obj.evaluated})
            ON CONFLICT (assignment_id, enrollee_id) DO UPDATE
                SET score=EXCLUDED.score, evaluated=EXCLUDED.evaluated;
        `);

        return result.rowCount == 1;
    }

    // static async update(assignmentId, enrolleeId, obj) {
    //     const result = await db.query(sql`
    //         UPDATE Evaluations
    //         SET score=${obj.score}, evaluated=${obj.evaluated}
    //         WHERE assignment_id=${assignmentId} AND enrollee=${enrolleeId};
    //     `);

    //     return result.rowCount == 1;
    // }

    static async delete(assignmentId, enrolleeId) {
        const result = await db.query(sql`
            DELETE FROM Evaluations
            WHERE assignment_id=${assignmentId} AND enrollee_id=${enrolleeId};
        `);

        return result.rowCount == 1;
    }

    forStudent() {
        return {assignment_id: this.assignment_id, enrollee_id: this.enrollee_id, score: this.score, evaluated: this.evaluated};
    }

    forInstructor() {
        return {assignment_id: this.assignment_id, enrollee_id: this.enrollee_id, score: this.score, evaluated: this.evaluated};
    }

    forAdmin() {
        return {assignment_id: this.assignment_id, enrollee_id: this.enrollee_id, score: this.score, evaluated: this.evaluated};
    }
}

export class EvaluatedWeight {
    constructor(obj) {
        ({enrollee_id: this.enrollee_id, weight_id: this.weight_id, total_score: this.total_score, total_evaluated: this.total_evaluated} = obj);
    }

    static async findByWeightIdAndEnrolleeId(weightId, enrolleeId) {
        const result = await db.query(sql`
            SELECT enrollee_id, weight_id, total_score, total_evaluated
            FROM EvaluatedWeights
            WHERE weight_id=${weightId} AND enrollee_id=${enrolleeId};
        `);

        if (result.rows.length == 1) {
            return new EvaluatedWeight(result.rows[0]);
        }
    }

    static async findManyByWeightId(weightId) {
        const result = await db.query(sql`
            SELECT enrollee_id, weight_id, total_score, total_evaluated
            FROM EvaluatedWeights
            WHERE weight_id=${weightId};
        `);

        return result.rows.map(obj => new EvaluatedWeight(obj));
    }

    static async findManyByEnrolleeId(enrolleeId) {
        const result = await db.query(sql`
            SELECT enrollee_id, weight_id, total_score, total_evaluated
            FROM EvaluatedWeights
            WHERE enrollee=${enrolleeId};
        `);

        return result.rows.map(obj => new EvaluatedWeight(obj));
    }

    static async findAll() {
        const result = await db.query(sql`
            SELECT enrollee_id, weight_id, total_score, total_evaluated
            FROM EvaluatedWeights;
        `);

        return result.rows.map(obj => new EvaluatedWeight(obj));
    }

    forStudent() {
        return {enrollee_id: this.enrollee_id, weight_id: this.weight_id, total_score: this.total_score, total_evaluated: this.total_evaluated};
    }

    forInstructor() {
        return {enrollee_id: this.enrollee_id, weight_id: this.weight_id, total_score: this.total_score, total_evaluated: this.total_evaluated};
    }

    forAdmin() {
        return {enrollee_id: this.enrollee_id, weight_id: this.weight_id, total_score: this.total_score, total_evaluated: this.total_evaluated};
    }
}

export class EvaluatedCourse {
    constructor(obj) {
        ({enrollee_id: this.enrollee_id, course_id: this.course_id, current_weighted_score: this.current_weighted_score, current_evaluated: this.current_evaluated, expected_weighted_score: this.expected_weighted_score, expected_evaluated: this.expected_evaluated} = obj);
    }

    static async findByCourseIdAndEnrolleeId(courseId, enrolleeId) {
        const result = await db.query(sql`
            SELECT enrollee_id, course_id, current_weighted_score, current_evaluated, expected_weighted_score, expected_evaluated
            FROM EvaluatedCourses
            WHERE course=${courseId} AND enrollee_id=${enrolleeId};
        `);

        if (result.rows.length == 1) {
            return new EvaluatedWeight(result.rows[0]);
        }
    }

    static async findManyByCourseId(courseId) {
        const result = await db.query(sql`
            SELECT enrollee_id, course_id, current_weighted_score, current_evaluated, expected_weighted_score, expected_evaluated
            FROM EvaluatedCourses
            WHERE course_id=${courseId};
        `);

        return result.rows.map(obj => new EvaluatedWeight(obj));
    }

    static async findManyByEnrolleeId(enrolleeId) {
        const result = await db.query(sql`
            SELECT enrollee_id, course_id, current_weighted_score, current_evaluated, expected_weighted_score, expected_evaluated
            FROM EvaluatedCourses
            WHERE enrollee=${enrolleeId};
        `);

        return result.rows.map(obj => new EvaluatedWeight(obj));
    }

    static async findAll() {
        const result = await db.query(sql`
            SELECT enrollee_id, course_id, current_weighted_score, current_evaluated, expected_weighted_score, expected_evaluated
            FROM EvaluatedCourses;
        `);

        return result.rows.map(obj => new EvaluatedWeight(obj));
    }

    forStudent() {
        return {enrollee_id: this.enrollee_id, course_id: this.course_id, current_weighted_score: this.current_weighted_score, current_evaluated: this.current_evaluated, expected_weighted_score: this.expected_weighted_score, expected_evaluated: this.expected_evaluated};
    }

    forInstructor() {
        return {enrollee_id: this.enrollee_id, course_id: this.course_id, current_weighted_score: this.current_weighted_score, current_evaluated: this.current_evaluated, expected_weighted_score: this.expected_weighted_score, expected_evaluated: this.expected_evaluated};
    }

    forAdmin() {
        return {enrollee_id: this.enrollee_id, course_id: this.course_id, current_weighted_score: this.current_weighted_score, current_evaluated: this.current_evaluated, expected_weighted_score: this.expected_weighted_score, expected_evaluated: this.expected_evaluated};
    }
}

export class EnrollmentUserLinkToken {
    static async create(enrollmentId) {
        const result = await db.query(sql`
            INSERT INTO EnrollmentUserLinkTokens (enrollment_id)
            VALUES (${enrollmentId})
            ON CONFLICT (enrollment_id) DO UPDATE
                SET token=EXCLUDED.token, timestamp=EXCLUDED.timestamp
            RETURNING token;
        `);

        if (result.rows.length == 1) {
            return {token: result.rows[0].token, expires: new Date(new Date(result.rows[0].timestamp).getTime() + 7*24*60*60*1000)};
        }
    }

    static async perform(token, studentId) {
        const client = await db.getClient();
        let enrollment_id;
        let result;
        try {
            await client.query('BEGIN');
            enrollment_id = await client.query(sql`
                DELETE FROM EnrollmentUserLinkTokens
                WHERE token=${token} AND timestamp>${new Date(new Date().getTime() - 7*24*60*60*1000)}
                RETURNING enrollment_id;
            `);

            if (enrollment_id.rows.length != 1) {
                throw null;
            }

            result = await client.query(sql`
                UPDATE Enrollments
                SET student_id=${studentId}
                WHERE id=${enrollment_id.rows[0].enrollment_id};
            `);

            await client.query('COMMIT');

        } catch (e) {
            await client.query('ROLLBACK');
            return;
        } finally {
            client.release();
        }

        if (result.rowCount != 1) {
            throw null;
        }

        return enrollment_id.rows[0].enrollment_id;
        // const result = await db.query(sql`
        //     UPDATE`)
    }

    static async cancel(enrollmentId) {
        await db.query(sql`
            DELETE FROM EnrollmentUserLinkTokens
            WHERE enrollment_id=${enrollmentId};
        `);
    }
}