import { Component } from '@angular/core';
import { User, UsersService } from '../users.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent {
  constructor(private users: UsersService) {}

  userName: string = '';
  userId: number = -1;
  userCreationRequired: boolean|undefined;

  ngOnInit() {
    this.users.getCurrentUser().subscribe(user => {
      if (user.userCreationRequired == true) {
        this.userCreationRequired = true;
        this.userName = ''
        this.userId = -1;
      } else {
        this.userCreationRequired = false;
        this.userName = user.name;
        this.userId = user.id;
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
}
