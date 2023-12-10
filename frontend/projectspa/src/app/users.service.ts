import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface User {
  id: number
  name: string
  userCreationRequired? : undefined
}

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
}
