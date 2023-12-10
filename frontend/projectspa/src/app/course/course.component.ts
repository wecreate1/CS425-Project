import { Component, Input } from '@angular/core';
import { CoursesService } from '../courses.service';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { catchError } from 'rxjs';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Enrollment } from '../types';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './course.component.html',
  styleUrl: './course.component.scss'
})
export class CourseComponent {
  @Input()
  id: number = 0

  constructor(private courses: CoursesService, private route: ActivatedRoute, private location: Location) {}

  name: string = '';
  credits: number = 0;

  enrollments: Enrollment[] = []

  enrolleeName: string = ''
  enrolleeEmail: string = ''
  enrolleeMetadata: string = ''

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.id = Number(params.get('id'));
      this.refresh();
    })
  }

  refresh() {
    this.enrollments = [];
    this.enrolleeName = '';
    this.enrolleeEmail = '';
    this.enrolleeMetadata = '';
    this.courses.getCourse(this.id).subscribe(course => {
      this.name = course.name;
      this.credits = course.credits;
    });
    this.courses.getEnrollments(this.id).subscribe(enrollments => {
      this.enrollments = enrollments;
    })
  }

  submit() {
    this.courses.updateCourse(this.id, this.name, this.credits).subscribe(()=>this.refresh());
  }

  delete() {
    this.courses.deleteCourse(this.id).subscribe(()=>this.location.back());
  }

  addEnrollment() {
    this.courses.addEnrollment(this.id, this.enrolleeName, this.enrolleeEmail, this.enrolleeMetadata).subscribe(()=>this.refresh());
  }
}
