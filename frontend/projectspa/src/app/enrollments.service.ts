import { Injectable } from '@angular/core';
import { Course, User, Enrollment } from './types';
import { HttpClient } from '@angular/common/http';

export interface LinkData {
  token: string
}

@Injectable({
  providedIn: 'root'
})
export class EnrollmentsService {

  constructor(private http: HttpClient) { }

  getEnrollment(id: number) {
    return this.http.get<Enrollment>(`http://localhost:3000/api/v1/enrollments/${id}`);
  }

  updateEnrollment(id: number, name: string, email: string, metadata: string) {
    return this.http.put(`http://localhost:3000/api/v1/enrollments/${id}`, {name, email, metadata});
  }

  deleteEnrollment(id: number) {
    return this.http.delete(`http://localhost:3000/api/v1/enrollments/${id}`);
  }

  unlinkEnrollment(id: number) {
    return this.http.post(`http://localhost:3000/api/v1/enrollments/${id}/unlink`, null);
  }

  getLinkToken(id: number) {
    return this.http.post<LinkData>(`http://localhost:3000/api/v1/enrollments/${id}/getLinkToken`, null);
  }
}
