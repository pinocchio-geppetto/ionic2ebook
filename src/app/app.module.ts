import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { SmscClearIdsDirective } from './directives/smsc-clear-ids.directive';
import { SmscColumnScrollDirective } from './directives/smsc-column-scroll.directive';
import { SmscBookContentComponent } from './components/smsc-book-content.component';
import { BookCover } from '../pages/book-cover/book-cover.component';
import { BodyText } from '../pages/body-text/body-text.component';
import { About } from '../pages/about/about.component';
import { GoToPageNumber } from '../pages/go-to-page-number/go-to-page-number.component';
import { StyleChange } from '../pages/style-change/style-change.component';


@NgModule({
  declarations: [
    MyApp,
    BookCover,
    SmscClearIdsDirective,
    SmscColumnScrollDirective,
    SmscBookContentComponent,
    GoToPageNumber,
    StyleChange,
    BodyText,
    About
  ],
  imports: [
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    BookCover,
    GoToPageNumber,
    StyleChange,
    BodyText,
    About
  ],
  providers: [{provide: ErrorHandler, useClass: IonicErrorHandler}]
})
export class AppModule {}
