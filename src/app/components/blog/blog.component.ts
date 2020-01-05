import { Component, OnInit,  ViewEncapsulation } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/auth";
import { DatabaseService } from "../../services/database/database.service";
import { Router } from "@angular/router";
import { PostInterface } from "../../interfaces/post/post.interface";

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BlogComponent implements OnInit {

  private $authStateChange;
  private isAdmin: number;
  private postsContainer: HTMLElement;
  public postLazyBatchSize: number = 5;
  public postLazyRecentId: string;

  constructor(
    private db: DatabaseService,
    private fireAuth: AngularFireAuth,
    private router: Router
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.postsContainer = document.querySelector('.posts');
    this.$authStateChange = this.fireAuth.authState.subscribe(user => {
      if (user) {
        const userReference = this.db.createReference(`users/${user.email}`);
        this.db.getValue(userReference, 'isAdmin')
        .then((isAdmin: number) => {
          this.isAdmin = isAdmin;
          this.retrievePosts();
        }).catch((error) => {
          window.alert(error.message);
        });
      }
    });
  }

  generatePostId(letterNumber = 0) {
    let t = new Date().getTime().toString();
    if (letterNumber) {
      const p = 'abcdefghijklmnopqrstuvwxyz';
      for (let i = letterNumber; i ; i--) {
        const j = Math.floor(Math.random() * Math.floor(p.length));
        const a = Math.floor(Math.random() * Math.floor(t.length))
        t = t.slice(0, a) + p[j] + t.slice(a);
      }
    }
    return t;
  }

  imprintPostHTML(post) {
    return `
      <div class="post" data-post-id="${post.id}">
          <div class="inputs">
              <input type="text" class="inputs__item inputs-title" value="${post.title || ''}" placeholder="Название записи..." disabled>
              <textarea class="inputs__item inputs-note" placeholder="Содержимое записи..." disabled>${post.note || ''}</textarea>
          </div>
          <div class="edit">
              <button class="edit__item button-view-post">Перейти к записи</button>
              ${this.isAdmin ? `<button class="edit__item button-delete-post">Удалить</button>` : ''}
          </div>
      </div>
    `;
  }

  postBindEvents(postId) {
    document.querySelector('[data-post-id="'+ postId +'"] .button-view-post').addEventListener('click', this.navigateToPost.bind(this, postId));
    if (this.isAdmin) document.querySelector('[data-post-id="'+ postId +'"] .button-delete-post').addEventListener('click', this.deletePost.bind(this, postId));
  }

  putHTML(options) {
    options.containter.insertAdjacentHTML(options.position || 'beforeend', options.html);
  }

  addPost() {
    const postId = this.generatePostId();
    const postReference = this.db.createReference(`posts/${postId}`);
    const postData: PostInterface = {
      id: postId,
      // title: new Date().toUTCString(),
      title: '',
      note: ''
    };
    
    this.putHTML({
      containter: this.postsContainer,
      html: this.imprintPostHTML(postData),
      position: 'afterbegin'
    });

    this.postBindEvents(postId);

    postReference.set(postData);
  }

  deletePost(postId) {
    this.db.createReference(`posts/${postId}`)
    .delete()
    .then(_ => document.querySelector('[data-post-id="' + postId + '"]').remove())
    .catch(error => window.alert('Document delete error' + error));
  }

  retrievePosts(lazyLoad = false) {
    const postsReference = this.db.query('posts', (reference) => {
      return lazyLoad ? reference.orderBy('id', 'desc')
                                 .startAfter(this.postLazyRecentId)
                                 .limit(this.postLazyBatchSize) 
                      : reference.orderBy('id', 'desc')
                                 .limit(this.postLazyBatchSize);
    });
    
    const $subscription = postsReference
          .snapshotChanges()
          .subscribe(postSnaphots => {
            postSnaphots.map(post => {
              const postData = post.payload.doc.data();
              this.putHTML({
                containter: this.postsContainer,
                html: this.imprintPostHTML(postData)
              });
              this.postBindEvents(postData.id);
              this.postLazyRecentId = postData.id;
            });
            $subscription.unsubscribe();
          });
  }

  navigateToPost(postId) {
    this.router.navigate(['/post'], {queryParams: {id: postId}});
  }

  logout() {
    this.$authStateChange.unsubscribe();
    this.fireAuth.auth.signOut().then(() => {
      this.router.navigate(['/login']);
    });
  }
}
