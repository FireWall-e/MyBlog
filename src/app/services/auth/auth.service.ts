import { Injectable, NgZone } from '@angular/core';
import { UserInterface } from "../../interfaces/user/user.interface";
import { auth } from 'firebase/app';
import { AngularFireAuth } from "@angular/fire/auth";
import { Router } from "@angular/router";
import { DatabaseService } from "../../services/database/database.service";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private fireAuth: AngularFireAuth,
    private router: Router,  
    private ngZone: NgZone,
    private db: DatabaseService
  ) { }

  SetUserData(user, callback) {
    const userReference = this.db.createReference(`users/${user.email}`);
    userReference.get().subscribe(userRecord => {
      if (!userRecord.exists) {
        const userData: UserInterface = {
          uid: user.uid,
          email: user.email,
          isAdmin: 0
        };
        userReference.set(userData)
        .then(_ => callback())
        .catch((error) => {
          window.alert(error)
        });
      }
      else {
        callback();
      }
    });
  }

  isLoggedIn(): Promise<boolean> {
    return new Promise((resolve) => {this.fireAuth.auth.onAuthStateChanged(userData => {
      if (userData) {
        resolve(true);
      }
      else {
        this.router.navigate(['login']);
        resolve(false);
      }
    });
  });
  }

  login(email, password) {
    return this.fireAuth.auth.signInWithEmailAndPassword(email, password)
      .then((result) => {
        this.ngZone.run(() => {
          this.router.navigate(['blog']);
        });
      }).catch((error) => {
        window.alert(error.message);
      })
  }

  register(email, password) {
    return this.fireAuth.auth.createUserWithEmailAndPassword(email, password)
      .then((result) => {
        this.SetUserData(result.user, () => window.alert('Регистрация прошла успешно!'));
      }).catch((error) => {
        window.alert(error.message)
      })
  }

  externalAuth(provider) {
    return this.fireAuth.auth.signInWithPopup(provider)
    .then((result) => {
      this.SetUserData(result.user, () => {
        this.ngZone.run(() => {
          this.router.navigate(['blog']);
        })
      });
    }).catch((error) => {
      window.alert(error)
    })
  }

  GoogleAuth() {
    return this.externalAuth(new auth.GoogleAuthProvider());
  }
}
