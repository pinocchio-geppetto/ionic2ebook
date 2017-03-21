import { Component, ViewChild } from '@angular/core';
import { Nav, Platform } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';

import { BookCover } from '../pages/book-cover/book-cover.component';
import { BodyText } from '../pages/body-text/body-text.component';
import { About } from '../pages/about/about.component';

import { PersistentDataService } from './services/persistent-data.service';
import { AnalyticsService } from './services/analytics-service';
import { InterstitialAdsService } from './services/interstitial-ads.service';

// hack: to get around (i.e. disable) type checking
type AnyType = any;

@Component({
  templateUrl: 'app.html',
  providers: [ PersistentDataService,
                InterstitialAdsService,
                AnalyticsService
  ]
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  constructor(public platform: Platform,
              protected persistentDataService: PersistentDataService,
              protected interstitialAdsService: InterstitialAdsService,
              protected analyticsService: AnalyticsService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then((readySource) => {
      // set version number. tag it correct. Allows app to know database version in future.
      this.persistentDataService.setItemAppVersion(JSON.stringify({major: 1, minor: 1}));
      // only load the main page of the app when device is ready
      this.nav.setRoot(BodyText, {
        alternateID: '_Toc417167144'
      });
      if (readySource == 'cordova') {
        // Okay, so the platform is ready and our plugins are available.
        // Here you can do any higher level native things you might need.
        StatusBar.styleDefault();
        Splashscreen.hide();
      }
    });
  }

  pushPageBookCover() {
    this.nav.push(BookCover);
  }

  pushPageAbout() {
    this.nav.push(About);
  }

  openPageBodyText(target: string) {
    if (this.nav.canGoBack()) {
      this.nav.pop();
    }

    if (target == 'toc') {
      this.nav.first().instance.navigate('Toc', null);
    }
    else if (target == 'body') { 
      this.nav.first().instance.navigate(null, '_Toc417167144');
    }
  }
}
