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