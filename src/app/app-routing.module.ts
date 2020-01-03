import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SecureInnerPagesGuard } from './guards/secure-inner-pages.guard';

import { HomepageComponent } from './components/homepage/homepage.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { BlogComponent } from './components/blog/blog.component';
import { PostComponent } from './components/post/post.component';

const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'blog', component: BlogComponent, canActivate: [SecureInnerPagesGuard]},
  { path: 'post', component: PostComponent, canActivate: [SecureInnerPagesGuard]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
