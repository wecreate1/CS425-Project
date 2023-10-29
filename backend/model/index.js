import * as db from './db';
import { sql } from './db';

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
            WHERE course=${courseId};
        `);

        return new Scale(result.rows);
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

    forInstructor() {
        return {course: this.course, instructor: this.instructor};
    }

    forAdmin() {
        return {course: this.course, instructor: this.instructor};
    }
}

export class Weight {
    constructor(obj) {
        ({id: this.id, course: this.coure, name: this.name, weight: this.weight, expected_max_score: this.expected_max_score, drop_n: this.drop_n} = obj);
    }

    static async findById(id) {
        const result = await db.query(sql`
            SELECT id, course, name, weight, expected_max_score, drop_n
            FROM Weights
            WHERE id=${id};
        `);

        if (result.rows.length == 1) {
            return new Weight(result.rows.length[0]);
        }
    }

    static async findManyByCourseId(courseId) {
        const result = await db.query(sql`
            SELECT id, course, name, weight, expected_max_score, drop_n
            FROM Weights
            WHERE course=${courseId};
        `);

        return result.rows.map(obj => new Weight(obj));
    }

    static async findAll() {
        const result = await db.query(sql`
            SELECT id, course, name, weight, expected_max_score, drop_n
            FROM Weights;
        `);

        return result.rows.map(obj => new Weight(obj));
    }

    forStudent() {
        return {id: this.id, course: this.id, name: this.name, weight: this.weight, expected_max_score: this.expected_max_score, drop_n: this.drop_n};
    }

    forInstructor() {
        return {id: this.id, course: this.id, name: this.name, weight: this.weight, expected_max_score: this.expected_max_score, drop_n: this.drop_n};
    }

    forAdmin() {
        return {id: this.id, course: this.id, name: this.name, weight: this.weight, expected_max_score: this.expected_max_score, drop_n: this.drop_n};
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

    static async findByWeight(id) {
        const result = await db.query(sql`
            SELECT id, weight, name, max_score
            FROM Assignments
            WHERE weight = ${id};
        `);

        return result.rows.map(obj => new Assignment(obj));
    }

    static async findAll(id) {
        const result = await db.query(sql`
            SELECT id, weight, name, max_score
            FROM Assignments;
        `);

        return result.rows.map(obj => new Assignment(obj));
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