import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Course, Enrollment } from './types';


@Injectable({
  providedIn: 'root'
})
export class CoursesService {

  constructor(private http: HttpClient) { }

  getCourse(id: number) {
    return this.http.get<Course>(`http://localhost:3000/api/v1/courses/${id}`);
  }

  updateCourse(id: number, name: string, credits: number) {
    return this.http.put(`http://localhost:3000/api/v1/courses/${id}`, {name, credits});
  }

  deleteCourse(id: number) {
    return this.http.delete(`http://localhost:3000/api/v1/courses/${id}`);
  }

  getEnrollments(id: number) {
    return this.http.get<Enrollment[]>(`http://localhost:3000/api/v1/courses/${id}/enrollments`);
  }

  addEnrollment(id: number, name: string, email: string, metadata: string) {
    return this.http.post(`http://localhost:3000/api/v1/courses/${id}/enrollments`, {name, email, metadata});
  }
}
