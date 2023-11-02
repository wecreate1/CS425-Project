## 3. Model

### 3.1. Core

At the core of the database design are 6 Entities:

- Courses
- ScaleMarks
- Weights
- Assignments
- Enrollments
- Evaluations

#### 3.1.1. Courses

Each course is the root of the rest of the core tables relationships. It is uniquely identified by an opaque `id`.

Aside from it's primary key, a course holds two fields: `name`, and `credits`. These values are not used for any logic, and their purpose is only for presentation to users.


#### 3.1.2. ScaleMarks

Each ScaleMark is associated with a course; the ScaleMarks of a course forms the grading scale of the courses.

A ScaleMark holds:

- `score`: the points needed to receive this mark.
- `mark`: the symbol or name of the mark (e.g. A, B, C+, C-, E, Fail, AA)
- `grade_point`: the value of this mark for gpa calculations. Only used for presentation to the user.

#### 3.1.3. Weight

Each Weight is associated with a course and; the Weights of a course forms the grading system of the course. A Weight is uniquely identified by an opaque `id`.

- `name`: the name of the weight/category. Only used for presentation to the user.
- `weight`: the weight of the Weight it's course.
- `expected_max_score`: the expected sum of the `max_score`s of the Assignments that will be below it at the end of the course.
- `drop_n`: the amount of assignments below it that will be dropped in the final grade of the course.

#### 3.1.4. Assignment

Each Assignment is associated with a weight. An Assignment is uniquely identified by an opaque `id`.

Aside from it's primary key, an Assignment holds:

- `name`: the name of the assignments. Only used for presentation to the user.
- `max_score`: the highest score that a student can receive on the assignment (except for extra credit)

#### 3.1.5. Enrollment

Each Enrollment is associated with a course; the Enrollments of a course forms the roster of the course. Each Enrollment *may* be associated with a user (the Student User). An Enrollment is uniquely identified by an opaque `id`.

Aside from it's primary key, an Enrollment holds:

- `name`: the name of the enrollee as determined by the instructor. This name is used only for presentation to the instructor of the course and student of the enrollment.
- `email`: the email of the enrollee as determined by the instructor. May be used for linking the Enrollment to Student Users.
- `metadata`: additional data determined by the instructor. This data is only used for presentation to the instructor.

#### 3.1.6.Evaluations

Each Evaluation is associated with an assignment and enrollment (the enrollee). An Evaluation is uniquely identified by these associations.

An Evaluation holds:

- `score`: the score that the enrollee received on the assignment. This may be above the `max_score` of the assignment in cases that extra credit was provided.
- `evaluated`: the amount of the assignment that was evaluated for the enrollee. (e.g. when max_score=90, score=20, and evaluated=30, the final score of the student when evaluated=90 will be greater than or equal to 20 and less than or equalt to 80, excluding cases of extra credit)

### 3.2. Data Control

To support users interacting with the core data in a controlled environment two more Entities are needed.

- Users
- OIDCSubject

#### 3.2.1. Users

Each User may be associated with an enrollment (as a Student User), or a Course (as an Instructor User). A User is uniquely identified by an opaque `id`.

Aside from it's primary key, a User holds:

- `name`: the name of the user. Only used for presentation to the user.

#### 3.2.2. OIDCSubject

Each OIDCSubject is associated with a user. The OIDCSubject provides a means for the application to link an authorization token from an authentication service to a user.

An OIDCSubject holds:

- `sub`: the subject of the tokens provided by an authorization sevice for a user.

# API

- GET /users
- POST /users
- GET /users/:id
- PUT /users/:id
- DELETE /users/:id
- GET /users/:id/enrollments
- POST /users/:id/enrollments/link
- GET /users/:id/instructs
- POST /users/:id/instructs

- GET /courses/:id
- PUT /courses/:id
- DELETE /courses/:id
- GET /courses/:id/courseEvaluations
- GET /courses/:id/courseEvaluations/:enrollee
- GET /courses/:id/enrollments
- POST /courses/:id/enrollments
- GET /courses/:id/scale
- PUT /courses/:id/scale
- GET /courses/:id/weights
- POST /courses/:id/weights

- GET /enrollments/:id
- PUT /enrollments/:id
- DELETE /enrollments/:id
- POST /enrollments/:id/getLink

- GET /weights/:id
- PUT /weights/:id
- DELETE /weights/:id
- GET /weights/:id/weightEvaluations
- GET /weights/:id/weightEvaluations/:enrollee
- GET /weights/:id/assignments
- POST /weights/:id/assignments

- GET /assignments/:id
- PUT /assignments/:id
- DELETE /assignments/:id
- GET /assignments/:id/evaluations
- GET /assignments/:id/evaluations/:enrollee
- PUT /assignments/:id/evaluations/:enrollee
- DELETE /assignments/:id/evaluations/:enrollee
