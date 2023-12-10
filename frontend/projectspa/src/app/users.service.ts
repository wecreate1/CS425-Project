import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Course, User, Enrollment } from './types';



interface UserCreationRequired {
  userCreationRequired: true
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private http: HttpClient) { }

  getCurrentUser() {
    return this.http.get<User|UserCreationRequired>('http://localhost:3000/api/v1/users/me');
  }

  getUser(id: number) {
    return this.http.get<User>(`http://localhost:3000/api/v1/users/${id}`);
  }

  createUser(name: string) {
    return this.http.post('http://localhost:3000/api/v1/users/me', {name});
  }

  updateUser(id: number, name: string) {
    return this.http.put(`http://localhost:3000/api/v1/users/${id}`, {name});
  }

  deleteUser(id: number) {
    return this.http.delete(`http://localhost:3000/api/v1/users/${id}`);
  }

  getInstructing(id: number) {
    return this.http.get<Course[]>(`http://localhost:3000/api/v1/users/${id}/instructs`);
  }

  addCourse(id: number, name: string, credits: number) {
    return this.http.post(`http://localhost:3000/api/v1/users/${id}/instructs`, {name, credits});
  }

  getEnrollments(id: number) {
    return this.http.get<Enrollment[]>(`http://localhost:3000/api/v1/users/${id}/enrollments`);
  }

  linkCourse(id: number, token: string) {
    return this.http.post(`http://localhost:3000/api/v1/users/${id}/enrollments/link`, {token});
  }
}
