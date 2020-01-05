import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { Router } from "@angular/router";
import { AngularFireAuth } from "@angular/fire/auth";
import { DatabaseService } from "../../services/database/database.service";
import { PostInterface } from "../../interfaces/post/post.interface";

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss']
})
export class PostComponent implements OnInit {
  private $authStateChange;
  private isAdmin: number;
  private post: PostInterface = {
    id: undefined,
    title: undefined,
    note: undefined
  };
  private postTitleElement: HTMLInputElement;
  private postNoteElement: HTMLTextAreaElement;
  private postReference;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fireAuth: AngularFireAuth,
    private db: DatabaseService
  ) { }

  ngOnInit() {
    this.$authStateChange = this.fireAuth.authState.subscribe(user => {
      if (user) {
        const userReference = this.db.createReference(`users/${user.email}`);
        this.db.getValue(userReference, 'isAdmin')
        .then((isAdmin: number) => {
          this.isAdmin = isAdmin;
        }).catch((error) => {
          window.alert(error.message);
        });
      }
    });
  }

  ngAfterViewInit() {
    this.postTitleElement = document.querySelector('.inputs-title');
    this.postNoteElement = document.querySelector('.inputs-note');
    this.post.id = this.route.snapshot.queryParamMap.get('id');
    this.postReference = this.db.createReference(`posts/${this.post.id}`);
    const $postSubscription = this.postReference.get().subscribe(postSnapshot => {
      const postData = postSnapshot.data();
      if (postData) {
        document.querySelector('.post').classList.remove('loading');
        this.post.title = postData.title;
        this.post.note = postData.note;
      }
      $postSubscription.unsubscribe();
    });
  }

  saveChanges() {
    document.querySelector('.post').classList.add('loading');
    this.postReference.update({
      title: this.postTitleElement.value,
      note: this.postNoteElement.value
    })
    .then(_ => document.querySelector('.post').classList.remove('loading'))
    .catch(error => window.alert('Post update error ' + error));
  }

  discardChanges() {
    this.postTitleElement.value = this.post.title;
    this.postNoteElement.value = this.post.note;
  }

  deletePost() {
    document.querySelector('.post').classList.add('loading');
    this.postReference.delete()
    .then(() => { 
        document.querySelector('.post').classList.remove('loading');
        this.router.navigate(['/blog']).then(()=>{
          const interval = setInterval(() => {
            const postElement = document.querySelector('[data-post-id="' + this.post.id + '"]');
            if (postElement) (postElement.remove(), clearInterval(interval));
          }, 150);
        });
    })
    .catch(error => window.alert('Post delete error ' + error));
  }

  logout() {
    this.$authStateChange.unsubscribe();
    this.fireAuth.auth.signOut().then(() => {
      this.router.navigate(['/login']);
    });
  }
}
