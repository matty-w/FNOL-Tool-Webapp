import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { FnolPageComponent } from './fnol-page/fnol-page.component';
import { LoadingPageComponent } from './loading-page/loading-page.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FnolPageComponent,
    LoadingPageComponent,
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
