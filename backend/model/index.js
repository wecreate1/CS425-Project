import * as db from './db';
import { sql } from './db';
import * as pg_format from 'pg-format';

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

    static async create(obj) {
        const result = await db.query(sql`
            INSERT INTO Users (name)
            VALUES (${obj.name})
            RETURNING id;
        `)

        if (result.rows.length  == 1) {
            return result.rows.length[0].id;
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
            FROM Courses INNER JOIN Enrollments ON Courses.id=Enrollments.course
            WHERE student=${studentId};
        `);
    
        return result.rows.map((obj) => new Course(obj));
    }

    static async findManyByInstructorId(instructorId) {
        const result = await db.query(sql`
            SELECT Courses.id, Courses.name, Courses.credits
            FROM Courses INNER JOIN Instructs ON Courses.id=Instructs.course
            WHERE instructor=${instructorId};
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
            return result.rows.length[0].id;
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
                WHERE course=${id};
            `);
            let marks_list = [];
            if (obj.marks != undefined) {
                for (const mark of obj.marks) {
                    marks_list.push([courseId, obj.score, obj.mark, obj.grade_point])
                }
            }
            await client.query(pg_format('INSERT INTO ScaleMarks (course, score, mark, grade_point) VALUES %L;', marks_list));
            await client.query('COMMIT');
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
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
        ({id: this.id, course: this.course, student: this.student, name: this.name, email: this.email, metadata: this.metadata} = obj);
    }

    get isLinked() {
        return this.student != null;
    }

    static async findById(id) {
        const result = await db.query(sql`
            SELECT Enrollments.id, Enrollments.course, Enrollments.student, Enrollments.name, Enrollments.email, Enrollments.metadata
            FROM Enrollments
            WHERE id=${id};
        `);

        if (result.rows.length == 1) {
            return new Course(result.rows[0]);
        }
    }

    static async findManyByStudentId(studentId) {
        const result = await db.query(sql`
            SELECT Enrollments.id, Enrollments.course, Enrollments.student, Enrollments.name, Enrollments.email, Enrollments.metadata
            FROM Enrollments
            WHERE student=${studentId};
        `);
    
        return result.rows.map((obj) => new Enrollment(obj));
    }

    static async findManyByCourseId(courseId) {
        const result = await db.query(sql`
            SELECT Enrollments.id, Enrollments.course, Enrollments.student, Enrollments.name, Enrollments.email, Enrollments.metadata
            FROM Enrollments
            WHERE course=${courseId};
        `);
    
        return result.rows.map((obj) => new Enrollment(obj));
    }

    static async findAll(id) {
        const result = await db.query(sql`
            SELECT Enrollments.id, Enrollments.course, Enrollments.student, Enrollments.name, Enrollments.email, Enrollments.metadata
            FROM Enrollments;
        `);

        return result.rows.map((obj) => new Course(obj));
    }

    static async create(courseId, obj) {
        const result = await db.query(sql`
            INSERT INTO Enrollments (course, name, email, metadata)
            VALUES (${courseId}, ${obj.name}, ${obj.email}, ${obj.metadata})
            RETURNING id;
        `)

        if (result.rows.length  == 1) {
            return result.rows.length[0].id;
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

    static async linkStudent(id, studentId) {
        const result = await db.query(sql`
            UPDATE Enrollments
            SET student=${studentId}
            WHERE id=${id};
        `);

        return result.rowCount == 1;
    }

    static async unlinkStudent(id) {
        const result = await db.query(sql`
            UPDATE Enrollments
            SET student=NULL
            WHERE id=${id};
        `);

        return result.rowCount == 1;
    }

    forStudent() {
        return {id: this.id, course: this.course, student: this.student, name: this.name};
    }

    forInstructor() {
        return {id: this.id, course: this.course, isLinked: this.isLinked, name: this.name, email: this.email, metadata: this.metadata};
    }

    forAdmin() {
        return {id: this.id, course: this.course, student: this.student, isLinked: this.isLinked, name: this.name, email: this.email, metadata: this.metadata};
    }
}

export class Instructs {
    constructor(obj) {
        ({coure: this.course, instructor: this.instructor} = obj);
    }

    static async findManyByCourseId(courseId) { // just in case we end up supporting multiple instructors per course
        const result = await db.query(sql`
            SELECT course, instructor
            FROM Instructs
            WHERE course=${courseId};
        `);

        return result.rows.map(obj => new Instructs(obj));
    }

    static async findManyByInstructorId(instructorId) {
        const result = await db.query(sql`
            SELECT course, instructor
            FROM Instructs
            WHERE instructor=${instructorId};
        `);

        return result.rows.map(obj => new Instructs(obj));
    }

    static async create(courseId, instructorId) {
        const result = await db.query(sql`
            INSERT INTO Instructs (course, instructor)
            VALUES (${courseId}, ${instructorId});
        `)

        return true;
    }

    static async delete(courseId, instructorId) {
        const result = await db.query(sql`
            DELETE FROM Instructs
            WHERE course=${courseId}, instructor=${instructorId};
        `);

        return result.rowCount == 1;
    }

    forInstructor() {
        return {course: this.course, instructor: this.instructor};
    }

    forAdmin() {
        return {course: this.course, instructor: this.instructor};
    }
}

export class Weight {
    constructor(obj) {
        ({id: this.id, course: this.coure, name: this.name, weight: this.weight, expected_max_score: this.expected_max_score, drop_n: this.drop_n, current_max_score: this.current_max_score} = obj);
    }

    static async findById(id) {
        const result = await db.query(sql`
            SELECT id, course, name, weight, expected_max_score, drop_n, current_max_score
            FROM WeightsExtended
            WHERE id=${id};
        `);

        if (result.rows.length == 1) {
            return new Weight(result.rows.length[0]);
        }
    }

    static async findManyByCourseId(courseId) {
        const result = await db.query(sql`
            SELECT id, course, name, weight, expected_max_score, drop_n, current_max_score
            FROM WeightsExtended
            WHERE course=${courseId};
        `);

        return result.rows.map(obj => new Weight(obj));
    }

    static async findAll() {
        const result = await db.query(sql`
            SELECT id, course, name, weight, expected_max_score, drop_n, current_max_score
            FROM WeightsExtended;
        `);

        return result.rows.map(obj => new Weight(obj));
    }

    static async create(courseId, obj) {
        const result = await db.query(sql`
            INSERT INTO Weights (course, name, weight, expected_max_score, drop_n)
            VALUES (${courseId}, ${name}, ${weight}, ${expected_max_score}, ${drop_n})
            RETURNING id;
        `);

        if (result.rows.length == 1) {
            return result.rows.length[0].id;
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
        return {id: this.id, course: this.id, name: this.name, weight: this.weight, expected_max_score: this.expected_max_score, drop_n: this.drop_n, current_max_score: this.current_max_score};
    }

    forInstructor() {
        return {id: this.id, course: this.id, name: this.name, weight: this.weight, expected_max_score: this.expected_max_score, drop_n: this.drop_n, current_max_score: this.current_max_score};
    }

    forAdmin() {
        return {id: this.id, course: this.id, name: this.name, weight: this.weight, expected_max_score: this.expected_max_score, drop_n: this.drop_n, current_max_score: this.current_max_score};
    }
}

export class Assignment {
    constructor(obj) {
        ({id: this.id, weight: this.weight, name: this.name, max_score: this.max_score} = obj);
    }

    static async findById(id) {
        const result = await db.query(sql`
            SELECT id, weight, name, max_score
            FROM Assignments
            WHERE id = ${id};
        `);

        if (result.rows.length == 1) {
            return new Assignment(result.rows[0]);
        }
    }

    static async findByWeight(weightId) {
        const result = await db.query(sql`
            SELECT id, weight, name, max_score
            FROM Assignments
            WHERE weight = ${weightId};
        `);

        return result.rows.map(obj => new Assignment(obj));
    }

    static async findByCourse(courseId) {
        const result = await db.query(sql`
            SELECT Assignments.id, Assignments.weight, Assignments.name, Assignments.max_score
            FROM Assignments INNER JOIN Weights ON Assignments.weight = Weights.id
            WHERE course = ${courseId};
        `);

        return result.rows.map(obj => new Assignment(obj));
    }

    static async findAll() {
        const result = await db.query(sql`
            SELECT id, weight, name, max_score
            FROM Assignments;
        `);

        return result.rows.map(obj => new Assignment(obj));
    }

    static async create(weightId, obj) {
        const result = await db.query(sql`
            INSERT INTO Assignments (weight, name, max_score)
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
        return {id: this.id, weight: this.weight, name: this.name, max_score: this.max_score};
    }

    forInstructor() {
        return {id: this.id, weight: this.weight, name: this.name, max_score: this.max_score};
    }

    forAdmin() {
        return {id: this.id, weight: this.weight, name: this.name, max_score: this.max_score};
    }
}

export class Evaluation {
    constructor(obj) {
        ({assignment: this.assignment, enrollee: this.enrollee, score: this.score, evaluated: this.evaluated} = obj);
    }

    static async findByAssignmentIdAndEnrolleeId(assignmentId, enrolleeId) {
        const result = await db.query(sql`
            SELECT assignment, enrollee, score, evaluated
            FROM Evaluations
            WHERE assignment = ${assignmentId} AND enrollee = ${enrolleeId};
        `);

        if (result.rows.length == 1) {
            return new Evaluation(result.rows[0]);
        }
    }

    static async findAll() {
        const result = await db.query(sql`
            SELECT assignment, enrollee, score, evaluated
            FROM Evaluations;
        `);

        return result.rows.map(obj => new Evaluation(obj));
    }

    static async findManyByAssignmentId(assignmentId) {
        const result = await db.query(sql`
            SELECT assignment, enrollee, score, evaluated
            FROM Evaluations
            WHERE assignment = ${assignmentId};
        `);

        return result.rows.map(obj => new Evaluation(obj));
    }

    static async findManyByEnrolleeId(enrolleeId) {
        const result = await db.query(sql`
            SELECT assignment, enrollee, score, evaluated
            FROM Evaluations
            WHERE enrollee = ${enrolleeId};
        `);

        return result.rows.map(obj => new Evaluation(obj));
    }

    static async create(assignmentId, enrolleeId, obj) {
        const result = await db.query(sql`
            INSERT INTO Evaluations (assignment, enrollee, score, evaluated)
            VALUES (${assignmentId}, ${enrolleeId}, ${obj.score}, ${obj.evaluated});
        `);

        return result.rowCount == 1;
    }

    static async update(assignmentId, enrolleeId, obj) {
        const result = await db.query(sql`
            UPDATE Evaluations
            SET score=${obj.score}, evaluated=${obj.evaluated}
            WHERE assignment=${assignmentId} AND enrollee=${enrolleeId};
        `);

        return result.rowCount == 1;
    }

    static async delete(assignmentId, enrolleeId) {
        const result = await db.query(sql`
            DELETE FROM Evaluations
            WHERE assignments=${assignmentId} AND enrollee=${enrolleeId};
        `);

        return result.rowCount == 1;
    }

    forStudent() {
        return {assignment: this.assignment, enrollee: this.enrollee, score: this.score, evaluated: this.evaluated};
    }

    forInstructor() {
        return {assignment: this.assignment, enrollee: this.enrollee, score: this.score, evaluated: this.evaluated};
    }

    forAdmin() {
        return {assignment: this.assignment, enrollee: this.enrollee, score: this.score, evaluated: this.evaluated};
    }
}

export class EvaluatedWeight {
    constructor(obj) {
        ({enrollee: this.enrollee, weight_id: this.weight_id, total_score: this.total_score, total_evaluated: this.total_evaluated} = obj);
    }

    static async findByWeightIdAndEnrolleeId(weightId, enrolleeId) {
        const result = await db.query(sql`
            SELECT enrollee, weight_id, total_score, total_evaluated
            FROM EvaluatedWeights
            WHERE weight_id=${weightId} AND enrollee=${enrolleeId};
        `);

        if (result.rows.length == 1) {
            return new EvaluatedWeight(result.rows[0]);
        }
    }

    static async findManyByWeightId(weightId) {
        const result = await db.query(sql`
            SELECT enrollee, weight_id, total_score, total_evaluated
            FROM EvaluatedWeights
            WHERE weight_id=${weightId};
        `);

        return result.rows.map(obj => new EvaluatedWeight(obj));
    }

    static async findManyByEnrolleeId(enrolleeId) {
        const result = await db.query(sql`
            SELECT enrollee, weight_id, total_score, total_evaluated
            FROM EvaluatedWeights
            WHERE enrollee=${enrolleeId};
        `);

        return result.rows.map(obj => new EvaluatedWeight(obj));
    }

    static async findAll() {
        const result = await db.query(sql`
            SELECT enrollee, weight_id, total_score, total_evaluated
            FROM EvaluatedWeights;
        `);

        return result.rows.map(obj => new EvaluatedWeight(obj));
    }

    forStudent() {
        return {enrollee: this.enrollee, weight_id: this.weight_id, total_score: this.total_score, total_evaluated: this.total_evaluated};
    }

    forInstructor() {
        return {enrollee: this.enrollee, weight_id: this.weight_id, total_score: this.total_score, total_evaluated: this.total_evaluated};
    }

    forAdmin() {
        return {enrollee: this.enrollee, weight_id: this.weight_id, total_score: this.total_score, total_evaluated: this.total_evaluated};
    }
}

export class EvaluatedCourse {
    constructor(obj) {
        ({enrollee: this.enrollee, course: this.course, current_weighted_score: this.current_weighted_score, current_evaluated: this.current_evaluated, expected_weighted_score: this.expected_weighted_score, expected_evaluated: this.expected_evaluated} = obj);
    }

    static async findByCourseIdAndEnrolleeId(courseId, enrolleeId) {
        const result = await db.query(sql`
            SELECT enrollee, course, current_weighted_score, current_evaluated, expected_weighted_score, expected_evaluated
            FROM EvaluatedCourses
            WHERE course=${courseId} AND enrollee=${enrolleeId};
        `);

        if (result.rows.length == 1) {
            return new EvaluatedWeight(result.rows[0]);
        }
    }

    static async findManyByCourseId(courseId) {
        const result = await db.query(sql`
            SELECT enrollee, course, current_weighted_score, current_evaluated, expected_weighted_score, expected_evaluated
            FROM EvaluatedCourses
            WHERE course=${courseId};
        `);

        return result.rows.map(obj => new EvaluatedWeight(obj));
    }

    static async findManyByEnrolleeId(enrolleeId) {
        const result = await db.query(sql`
            SELECT enrollee, course, current_weighted_score, current_evaluated, expected_weighted_score, expected_evaluated
            FROM EvaluatedCourses
            WHERE enrollee=${enrolleeId};
        `);

        return result.rows.map(obj => new EvaluatedWeight(obj));
    }

    static async findAll() {
        const result = await db.query(sql`
            SELECT enrollee, course, current_weighted_score, current_evaluated, expected_weighted_score, expected_evaluated
            FROM EvaluatedCourses;
        `);

        return result.rows.map(obj => new EvaluatedWeight(obj));
    }

    forStudent() {
        return {enrollee: this.enrollee, course: this.course, current_weighted_score: this.current_weighted_score, current_evaluated: this.current_evaluated, expected_weighted_score: this.expected_weighted_score, expected_evaluated: this.expected_evaluated};
    }

    forInstructor() {
        return {enrollee: this.enrollee, course: this.course, current_weighted_score: this.current_weighted_score, current_evaluated: this.current_evaluated, expected_weighted_score: this.expected_weighted_score, expected_evaluated: this.expected_evaluated};
    }

    forAdmin() {
        return {enrollee: this.enrollee, course: this.course, current_weighted_score: this.current_weighted_score, current_evaluated: this.current_evaluated, expected_weighted_score: this.expected_weighted_score, expected_evaluated: this.expected_evaluated};
    }
}