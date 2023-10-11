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

    toJSON() {
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

    toJSON() {
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

    toJSON() {
        return {marks: this.marks};
    }
}