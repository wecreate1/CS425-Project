export interface Course {
    id: number
    name: string
    credits: number
}

export interface Enrollment {
    id: number
    course_id: number
    student_id: number|undefined
    name: string
    course: Course|undefined
    isLinked: boolean|undefined
    metadata: string|undefined
    email: string|undefined
}

export interface User {
    id: number
    name: string
    userCreationRequired? : undefined
}