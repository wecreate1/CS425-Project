import { Component, Input } from '@angular/core';
import { EnrollmentsService } from '../enrollments.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-enrollment',
  standalone: true,
  imports: [],
  templateUrl: './enrollment.component.html',
  styleUrl: './enrollment.component.scss'
})
export class EnrollmentComponent {
  @Input()
  id: number = 0;

  constructor(public enrollments: EnrollmentsService, public route: ActivatedRoute) {}

  name: string = ''
  email: string = ''
  metadata: string = ''
  isLinked: boolean = false

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.id = Number(params.get('id'));
      this.refresh();
    })
  }

  refresh() {
    this.enrollments.getEnrollment(this.id).subscribe(enrollment => {
      this.name = enrollment.name;
      this.email = enrollment.email || '';
      this.metadata = enrollment.metadata || '';
      this.isLinked = enrollment.isLinked || false;
    });
    // this.courses.getEnrollments(this.id).subscribe(enrollments => {
    //   this.enrollments = enrollments;
    // })
  }

  unlink() {
    this.enrollments.unlinkEnrollment(this.id).subscribe(()=>this.refresh());
  }

  beginLink() {
    this.enrollments.getLinkToken(this.id).subscribe(linkData=>{alert(`Link Token: ${linkData.token}`)});
  }
}
