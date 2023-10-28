# Project Design

## Use Cases

1. Students performing analysis on their own grades. This is the primary use case.

2. Instructors managing a course and grading multiple students.

3. Students receiving grades from instructors.

## Design

The application shall support:

1. Users creating Courses and adding Enrollments to such courses.

2. Users adding Grading Systems to Courses that they are Instructors of.

3. Users adding Assignments to Courses that they are Instructors of.

4. Users assigning grades to Enrollments for Assignments in Courses that they are Instructors of.

5. linking Enrollments to Users.

6. Users receiving and reviewing analysis of their grades in Courses that they are Enrolled in.

These functions support use cases 2 and 3. Since use case 1 is a special case where a User is both an Instructor and the only Enrolled Student of a course, these functions also support use case 1.

### Authentication

Since our team does not have the necessary skills to create a secure authentication system, the application shall support industry standards for authentication such that it can rely on third-parties (such as Auth0) to authenticate users.
