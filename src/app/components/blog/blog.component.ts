import { Component, OnInit,  ViewEncapsulation } from '@angular/core';
// import { AuthService } from "../../services/auth/auth.service";
// import { DataService } from "../../services/data/data.service";
import { AngularFireAuth } from "@angular/fire/auth";
import { DatabaseService } from "../../services/database/database.service";
import { Router } from "@angular/router";
// import { UserInterface } from "../../interfaces/user/user.interface";
import { PostInterface } from "../../interfaces/post/post.interface";
// import { Observable } from 'rxjs';


@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BlogComponent implements OnInit {
  // private data: object;
  // private user: object = {};
  private $authStateChange;
  private isAdmin: number;
  private postsContainer: HTMLElement;
  public postLazyBatchSize: number = 5;
  public postLazyRecentId: string;
  // private htmlToAdd = '';

  // @ViewChild('posts', { static: false }) posts: ElementRef;

  constructor(
    // private dataService: DataService,
    // private authService: AuthService,
    // public myElement: ElementRef,
    private db: DatabaseService,
    private fireAuth: AngularFireAuth,
    private router: Router,
    // private renderer: Renderer2
  ) {
    
    // this.dataService.data.subscribe(data => {this.data = data;this.data.user = {};console.log('blog data is ', data)});
    
    // console.log('this.userAuth is ', this.userAuth);
    
  }

  // test() {
    
  // }

  ngOnInit() {
   
    // console.log(this.fireAuth.auth.currentUser);
    // this.fireAuth.authState.subscribe(user => console.log('auth user is ', user));
    // this.dataService.data.subscribe(data => (this.data = data,console.log('blog data is ', data)));
    // console.log('getData is ', this.dataService.getData());
    // console.log('this data is ', this.data);
    // console.log('blog user data is ', this.data.userRef.valueChanges().subscribe(data=> console.log(data)));
  }

  ngAfterViewInit() {
    this.postsContainer = document.querySelector('.posts');
    this.$authStateChange = this.fireAuth.authState.subscribe(user => {
      if (user.email) {
        const userReference = this.db.createReference(`users/${user.email}`);
        // this.data.user.data = auth;
        this.db.getValue(userReference, 'isAdmin')
        .then((isAdmin: number) => {
          // .then((user: object) => {
          this.isAdmin = isAdmin;
          this.retrievePosts();
          // console.log('this.userAuth is ',user);
        }).catch((error) => {
          window.alert(error.message)
        });
      }
    });
    // console.log('this.test is ', this.test());
    // console.log('posts are ', this.postsContainer);
    // this.htmlToAdd = `<div>${new Date()}</div>`;
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
    // console.log('THIS IS ', this.isAdmin);
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
    // for (let i = 0; i < postIds.length; i++) {
      // console.log('bind is ', postIds[i], postIds);
    document.querySelector('[data-post-id="'+ postId +'"] .button-view-post').addEventListener('click', this.navigateToPost.bind(this, postId));
    if (this.isAdmin) document.querySelector('[data-post-id="'+ postId +'"] .button-delete-post').addEventListener('click', this.deletePost.bind(this, postId));
    // }
  }

  putHTML(options) {
    options.containter.insertAdjacentHTML(options.position || 'beforeend', options.html);
  }

  addPost() {
    // console.log('FIRED')
    // const date = new Date();
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
    // console.log('remove postId ', postId);
    this.db.createReference(`posts/${postId}`)
    .delete()
    .then(_ => document.querySelector('[data-post-id="' + postId + '"]').remove())
    .catch(error => window.alert('Document delete error' + error));
    
  }

  retrievePosts(lazyLoad = false) {
    // const postsReference = this.db.query('posts', {
    //   orderBy: 'id',
    //   startAfter: postLazyRecentId,
    //   limit: this.postLazyBatchSize
    // });

    const postsReference = this.db.query('posts', (reference) => {
      return lazyLoad ? reference.orderBy('id', 'desc')
                                 .startAfter(this.postLazyRecentId)
                                 .limit(this.postLazyBatchSize) 
                      : reference.orderBy('id', 'desc')
                                 .limit(this.postLazyBatchSize);
    });
    
    // console.log('postLazyBatchSize  ', this.postLazyBatchSize );
    const $subscription = postsReference
          .snapshotChanges()
          .subscribe(postSnaphots => {
            console.log('postSnaphots are', postSnaphots);
            // posts = Array.prototype.reverse.call(posts);
            postSnaphots.map(post => {
              const postData = post.payload.doc.data();
              console.log('postData is ', postData, 'html', this.imprintPostHTML(postData));
              this.putHTML({
                containter: this.postsContainer,
                html: this.imprintPostHTML(postData)
              });
              this.postBindEvents(postData.id);
              this.postLazyRecentId = postData.id;
            });
            $subscription.unsubscribe();
            console.log('LAST IS ', this.postLazyRecentId);
          });
 
    console.log('retrieve post ref is ', postsReference);
  }

  // postLazyLoad() {
  //   this.retrievePosts(this.postLazyRecentId);
  // }

  navigateToPost(postId) {
    this.router.navigate(['/post'], {queryParams: {id: postId}});
  }

  logout() {
    this.$authStateChange.unsubscribe();
    this.fireAuth.auth.signOut().then(() => {
      this.router.navigate(['/login']);
    });
    // });
  }
}
