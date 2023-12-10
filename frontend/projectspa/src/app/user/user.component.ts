import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Course, User, Enrollment } from '../types';
import { UsersService } from '../users.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent {
  constructor(private users: UsersService) {}

  userName: string = '';
  userId: number = -1;
  userCreationRequired: boolean|undefined;

  courseName: string = '';
  courseCredits: number = 0;

  instructing: Course[] = [];
  enrollments: Enrollment[] = [];

  linkToken: string = "";

  ngOnInit() {
    this.courseName = '';
    this.courseCredits = 0;
    this.instructing = [];
    this.userCreationRequired = false;
    this.userName = ''
    this.userId = -1;
    this.linkToken = "";
    this.users.getCurrentUser().subscribe(user => {
      if (user.userCreationRequired == true) {
        this.userCreationRequired = true;
      } else {
        this.userCreationRequired = false;
        this.userName = user.name;
        this.userId = user.id;
        this.users.getInstructing(this.userId).subscribe(courses => {
          this.instructing = courses;
        });
        this.users.getEnrollments(this.userId).subscribe(enrollments => {
          this.enrollments = enrollments;
        })
    }
    })
  }

  submit() {
    if (this.userCreationRequired) {
      this.users.createUser(this.userName).subscribe(()=>{this.ngOnInit()});
    } else {
      this.users.updateUser(this.userId, this.userName).subscribe(()=>{this.ngOnInit()});;
    }
  }

  delete() {
    this.users.deleteUser(this.userId).subscribe(()=>{this.ngOnInit()});
  }

  addCourse() {
    this.users.addCourse(this.userId, this.courseName, this.courseCredits).subscribe(()=>{this.ngOnInit()});
  }

  linkCourse() {
    this.users.linkCourse(this.userId, this.linkToken).subscribe(()=>{this.ngOnInit()});
  }
}
