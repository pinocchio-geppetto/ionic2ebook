import { Component } from '@angular/core';

import { NavController } from 'ionic-angular';
import { StatusBar } from 'ionic-native';

import { BodyText } from '../body-text/body-text.component';

@Component({
  selector: 'page-book-cover',
  templateUrl: 'book-cover.component.html'
})
export class BookCover {

  constructor(public navCtrl: NavController) {
    StatusBar.show();
  }

  public onTap() {
    this.navCtrl.setRoot(BodyText);
  }

}
