import { Component } from '@angular/core';

import { NavController } from 'ionic-angular';
import { StatusBar } from 'ionic-native';

@Component({
  selector: 'page-about',
  templateUrl: 'about.component.html'
})
export class About {

  constructor(public navCtrl: NavController) {
    StatusBar.show();
  }

}
