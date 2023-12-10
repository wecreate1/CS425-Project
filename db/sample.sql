INSERT INTO Users (id, name)
VALUES (1, 'Alice'),
  (2, 'Bob'),
  (3, 'Cassy'),
  (4, 'Donald');

INSERT INTO OIDCSubject (sub, user_id)
VALUES ('alice', 1),
  ('rob', 2),
  ('cassy', 3),
  ('donald', 4);

INSERT INTO Courses (id, name, credits)
VALUES (1, 'CS425', 3),
  (2, 'MATH474', 4),
  (3, 'CS351', 3);

INSERT INTO Instructs (course_id, instructor_id)
VALUES (1, 3),
  (3, 3),
  (2, 4);

INSERT INTO ScaleMarks (course_id, score, mark, grade_point)
VALUES (1, 0.8, 'A', 4),
  (1, 0.7, 'B', 3),
  (1, 0.6, 'C', 2),
  (1, 0.5, 'D', 1),
  (1, 0, 'E', 0),
  (2, 0.9, 'A', 4),
  (2, 0.75, 'B', 3),
  (2, 0.6, 'C', 2),
  (2, 0.5, 'D', 1),
  (2, 0, 'E', 0),
  (3, 980, 'A++', 4.2),
  (3, 900, 'A', 4),
  (3, 750, 'B', 3),
  (3, 600, 'C', 2),
  (3, 500, 'D', 1),
  (3, 0, 'E', 0);

INSERT INTO Enrollments (id, course_id, student_id, name, email, metadata)
VALUES (1, 1, 1, 'Alison', 'a@b.com', 'Hii!'),
  (2, 1, 2, 'Robert', NULL, 'Great student'),
  (3, 1, 4, 'Donald', NULL, NULL),
  (4, 2, 1, 'Alison', 'b@b.com', NULL),
  (5, 2, 2, 'Robert', NULL, NULL),
  (6, 3, 1, 'Alison', 'c@b.com', NULL),
  (7, 3, 3, 'Cassidy', NULL, NULL),
  (8, 3, NULL, 'Edward', NULL, 'Prefers paper');

INSERT INTO Weights (id, course_id, name, weight, expected_max_score, drop_n)
VALUES (1, 1, 'Course Project', 0.2, 100, 0),
  (2, 1, 'Midterm Exam', 0.25, 100, 0),
  (3, 1, 'Final Exam', 0.35, 150, 0),
  (4, 1, 'HW', 0.2, 200, 1),
  (5, 2, 'HW', 0.1, 100, 3),
  (6, 2, 'Final', 0.9, 100, 0),
  (7, 3, 'Labs', 800, 1000, 1),
  (8, 3, 'Final Exam', 200, 100, 0);

INSERT INTO Assignments (id, weight_id, name, max_score)
VALUES (1, 2, 'Midterm', 100),
  (2, 4, 'HW1', 50),
  (3, 4, 'HW2', 60),
  (4, 5, 'HW 1 -- Counting', 10),
  (5, 5, 'HW 2 -- Counting Extended', 10),
  (6, 5, 'HW 3 -- Conditional Probability', 10),
  (7, 6, 'Bomblab', 350);

INSERT INTO Evaluations (assignment_id, enrollee_id, score, evaluated)
VALUES (2, 1, 0.7, 1),
  (2, 2, 0.99, 1),
  (2, 3, 0.3, 1),
  (3, 1, 0.3, 0.5),
  (3, 2, 0.49, 0.5),
  (3, 3, 0, 1),
  (6, 6, 300, 1),
  (6, 7, 232, 1),
  (6, 8, 350, 1);

INSERT INTO EnrollmentUserLinkTokens (token, enrollment_id, timestamp)
VALUES ('7a509823-a5e5-48a2-9fd0-36a6ed6ba83a', 8, '2023-12-10T04:59:54+00:00');