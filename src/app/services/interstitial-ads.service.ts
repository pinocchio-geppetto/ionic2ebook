import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';

import { AdMob } from 'ionic-native';
import { Platform } from 'ionic-angular';


@Injectable()
export class InterstitialAdsService {
  //type AdStatus = number;
  protected static readonly NOT_INITIATED = 0;        // ad not downloaded yet. prepareInterstitial() not called
  protected static readonly REQUESTED = 1;            // ad downloaded but not shown. prepareInterstitial() called and successful
  protected static readonly REQUEST_FAILED = 2;       // ad download failed. prepareInterstitial() called and failed
  protected static readonly REQUEST_SUCCEEDED = 3;    // ad ready to be shown
  protected static readonly AD_PRESENTED = 4;    // ad presented
  protected readyToShowAds: number = InterstitialAdsService.NOT_INITIATED;

  // the interval to show ads is randomised between (minInterval, interval]
  protected readonly minInterval: number = 450000; // minimum interval between ads
  protected interval: number = 900000; // 10 minutes
  protected randomisedInterval: number = this.minInterval; // randomised interval to display ads
  protected timerSinceLastAdDisplayed: number = 0; // in Date().getTime() or ticks

  protected minShowRequestsToShowAd: number = 5; // min number of calls to show ad before ad is actually shown
  protected minShowRequestCounter: number = 0; // counter - how many times have show() been called

  protected adOptions = {
    adId: 'ca-app-pub-3940256099942544/4411468910', // test from firebase, will be changed to actual in the constructor
    isTesting: false,
    overlap: true,
    autoShow: false
  };
  
  constructor(
    @Inject(DOCUMENT) private document : any,
    public platform: Platform
  ) {
    this.timerSinceLastAdDisplayed = Date.now();
    this.randomisedInterval = this.getRandomInterval();
    
    /* for future use. Ad targetting... whatever it means, it needs to be studied carefully cause it is not what I have in mind
    if (AdMob) AdMob.setOptions({
      forChild: 'no'
      // contentURL: <URL to online content> to be filled in later with website
      //location: [longitude, latitude] to be filled in later
     }); */

    document.addEventListener('onAdLoaded',(data: {adNetwork: string, adType: string, adEvent: string}) => {
      if (data.adType.toLowerCase() == 'interstitial')
        this.readyToShowAds = InterstitialAdsService.REQUEST_SUCCEEDED;
        console.log('tsc: Interstitial ad loaded.');
    });

    if (this.platform.is('ios')) {
      this.adOptions.adId = 'ca-app-pub-3940256099942544/4411468910', // test from firebase. Change this to your adId
      console.log('ios ad selected.');
    }
    else if (this.platform.is('android')) {
      this.adOptions.adId = 'ca-app-pub-3940256099942544/4411468910', // test from firebase. Change this to your adId
      console.log('andoird ad selected.');
    }
  }

  protected getRandomInterval(): number {
    let interval = (Math.random() * (this.interval - this.minInterval))  + this.minInterval;

    return Math.round(interval);
  }

  public prepare(): void {
    // if in the process of requesting an ad, or ad ready to be presented, then do nothing
    if ((this.readyToShowAds == InterstitialAdsService.REQUESTED) ||
        (this.readyToShowAds == InterstitialAdsService.REQUEST_SUCCEEDED)) {
      return;
    }

    if (AdMob) {
      AdMob.prepareInterstitial(this.adOptions)
      .then(() => {
      },
      (error) => {
        this.readyToShowAds = InterstitialAdsService.REQUEST_FAILED;
      });
      this.readyToShowAds = InterstitialAdsService.REQUESTED;
    }
  }

  // interval is in miliseconds and to be fed to setTimeout().
  public show(): boolean {
    this.minShowRequestCounter++;

    if (this.readyToShowAds == InterstitialAdsService.REQUEST_SUCCEEDED) {
      // if the timer has expired and number of page flips has exceeded
      let now = Date.now();
      if (((this.timerSinceLastAdDisplayed + this.randomisedInterval) <= now) ||
          ((this.minShowRequestCounter >= this.minShowRequestsToShowAd) &&
           ((this.timerSinceLastAdDisplayed + this.minInterval) <= now))) {
        this.minShowRequestCounter = 0;
        this.timerSinceLastAdDisplayed = now;
        this.randomisedInterval = this.getRandomInterval();

        setTimeout(() => { this.prepare(); }, 1); // download next ad
        
        if (AdMob) {
          AdMob.showInterstitial();
          this.readyToShowAds = InterstitialAdsService.AD_PRESENTED;
        }
        console.log('tsc: Interstitial ad presented.');
        return true;
      }
    }
    else if (this.readyToShowAds != InterstitialAdsService.REQUESTED) {
      this.prepare();
      return false;
    }

    return false;
  }
};
