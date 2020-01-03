import { Component, OnInit } from '@angular/core';
import { AuthService } from "../../services/auth/auth.service";
// import { ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(
    public authService: AuthService,
   
  ) { }

  ngOnInit() {
    
  }

}
