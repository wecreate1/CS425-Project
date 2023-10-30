CREATE TABLE Users (
    id UNIQUE INT NOT NULL,
    name VARCHAR NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE OIDCSubject (
    sub VARCHAR UNIQUE,
    user INT,
    PRIMARY KEY (sub),
    FOREIGN KEY (user) REFERENCES Users(id)
);

-- CREATE TABLE Scale (
--     id UNIQUE INT NOT NULL,
--     name VARCHAR NOT NULL,
--     PRIMARY KEY (id)
-- );

CREATE TABLE Courses (
    id UNIQUE INT NOT NULL,
    name VARCHAR NOT NULL,
    -- scale INT NOT NULL,
    credits INT NOT NULL,
    PRIMARY KEY (id),
    -- FOREIGN KEY (scale) REFERENCES Scale(id)
);

CREATE TABLE ScaleMarks (
    course INT NOT NULL,
    -- scale INT NOT NULL,
    score REAL NOT NULL,
    mark VARCHAR NOT NULL,
    grade_point REAL NOT NULL,
    PRIMARY KEY (course, score)
    -- PRIMARY KEY (scale, score)
    FOREIGN KEY (course) REFERENCES Courses(id)
    -- FOREIGN KEY (scale) REFERENCES Scale(id)
);

CREATE TABLE Enrollments (
    id UNIQUE INT NOT NULL,
    course INT NOT NULL,
    student INT NULL,
    name VARCHAR NOT NULL,
    email VARCHAR NULL;
    metadata VARCHAR,
    PRIMARY KEY (id),
    FOREIGN KEY (course) REFERENCES Courses(id),
    FOREIGN KEY (student) REFERENCES Users(id)
);

CREATE TABLE Instructs (
    course INT NOT NULL,
    instrucor INT NOT NULL,
    PRIMARY KEY (course, instrucor),
    FOREIGN KEY (course) REFERENCES Courses(id),
    FOREIGN KEY (instrucor) REFERENCES Users(id)
);

CREATE TABLE Weights (
    id UNIQUE INT NOT NULL,
    course INT NOT NULL,
    name VARCHAR NOT NULL,
    weight REAL NOT NULL,
    expected_max_score REAL NULL,
    drop_n INT NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (course) REFERENCES Courses(id)
);

CREATE TABLE Assignments (
    id UNIQUE INT NOT NULL,
    weight INT NOT NULL,
    name VARCHAR NOT NULL,
    max_score REAL,
    PRIMARY KEY (id),
    FOREIGN KEY (weight) REFERENCES Weights(id)
);

CREATE TABLE Evaluations (
    assignment INT NOT NULL,
    enrollee INT NOT NULL,
    score REAL NOT NULL,
    evaluated REAL NOT NULL,
    PRIMARY KEY (assignment, enrollee),
    FOREIGN KEY (assignment) REFERENCES Assignments(id),
    FOREIGN KEY (enrollee) REFERENCES Enrollments(id)
);

CREATE VIEW WeightsCalculated AS
SELECT Weights.id AS id, SUM(Assignmets.max_score) AS current_max_score
FROM Weights INNER JOIN Assignments ON Weights.id=Assignments.id
GROUP BY Weights.id;

CREATE VIEW WeightsExtended AS
SELECT Weights.*, current_max_score
FROM Weights INNER JOIN WeightsCalculated ON Weights.id=WeightsCalculated.id;

-- CREATE VIEW EvaluationsExtended AS
-- SELECT Evaluations.*, Assignments.weight AS weight
-- FROM Evaluations INNER JOIN Assignments ON Evaluations.assignment=Assignments.id;

CREATE VIEW EvaluatedWeights AS
SELECT Evaluations.enrollee AS enrollee, Assignments.weight AS weight_id, SUM(Evaluations.score) AS total_score, SUM(Evaluations.evaluated) AS total_evaluated
FROM Evaluations INNER JOIN Assignments ON Evaluations.assignment=Assignmets.id
GROUP BY enrollee, Assignments.weight;

CREATE VIEW EvaluatedCourses AS
SELECT EvaluatedWeights.enrollee AS enrollee,
       Weights.course AS course,
       SUM(EvaluatedWeights.total_score*WeightsExtended.weight/WeightsExtended.current_max_score) AS current_weighted_score,
       SUM(EvaluatedWeights.total_evaluated*WeightsExtended.weight/WeightsExtended.current_max_score) AS current_evaluated,
       SUM(EvaluatedWeights.total_score*WeightsExtended.weight/WeightsExtended.expected_max_score) AS expected_weighted_score,
       SUM(EvaluatedWeights.total_evaluated*WeightsExtended.weight/WeightsExtended.expected_max_score) AS expected_evaluated
FROM EvaluatedWeights INNER JOIN WeightsExtended ON EvaluatedWeights.weight_id=Weights.id
GROUP BY EvaluatedWeights.enrollee, Weights.course;