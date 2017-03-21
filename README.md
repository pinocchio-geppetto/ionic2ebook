# Ionic2eBook
Ionic2eBook is an ebook reader built with Ionic2, Angular2 and Cordova.

This ebook reader displays each page with CSS multi-column layout. As each page is panned forward, this ebook will page to the next column on the right. Similarly, for each pan backwards, this ebook will page to the next column on the left.

All HTML5 content and CSS styling that can be displayed in CSS multi-column layout can be displayed by this eBook reader.

The advantages of this eBook reader are:
- Ability to track usage statistics using Firebase Analytics. Each pan of a page is tracked.
- Ability to monitize content using AdMob advertisements.
- Runs on both Android and iOS.

## Example Use of This eBook
This eBook is used to publish the following books on the following platforms:
- [iOS, Malaysian Labour Law Abridged](https://itunes.apple.com/pk/app/malaysian-labour-law-abridged/id991514757?mt=8)
- [Android, Malaysian Labour Law Abridged](https://play.google.com/store/apps/details?id=com.singularmosaic.malaysianlabourlaw&hl=en)

## Install Ionic2, Angular2 and Cordova
```
npm install -g cordova ionic
```

## Download The Source Code and Libraries
```
git clone https://github.com/pinocchio-geppetto/ionic2ebook.git
cd ionic2ebook
npm update
```

## Compile and Run on a Web Browser
```
ionic serve
```

## Compile and Run on iOS
1. Install XCode as described in https://cordova.apache.org/docs/en/latest/guide/platforms/ios/.
2. Run `ionic build ios --prod --release`
3. Upload and run the generated app on an iOS device or on an emulator.

## Compile and Run on Android
1. Install AndroidStudio as described in https://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html.
2. Run `ionic build android --prod --release'
3. Upload and run the generated app on an Android device or on an emulator.

# Configuration
Compile the source code into an app on either Android or iOS.

## How to Compile This eBook on Android

## How to Comipile This eBook on iOS

## How to Place Content Into This eBook

## Configure Firebase Analytics
Register a Firebase account. For each platform, do the following:
1. For Android, update ionic2ebook/google-services.json with a new download from your Firebase console. Formore information: https://firebase.google.com/docs/android/setup.
2. For iOS, update ionic2ebook/GoogleService-Info.plist with a new download from your Firebase console. For more information: https://firebase.google.com/docs/ios/setup.

If the firebase files above are not updated, the app will continue to work but there will be no Firebase reporting.

## Configure AdMob
Register an AdMob account. For each platform, do the following:
1. For Android, edit the file ionic2ebook/src/app/service/interstitial-ads.service.ts. In the constructor of the class `class InterstitialAdsService`, update the adId to your AdMob adID.
2. For Android, edit the file ionic2ebook/src/app/service/interstitial-ads.service.ts. In the constructor of the class `class InterstitialAdsService`, update the adId to your AdMob adID.

```
    if (this.platform.is('ios')) {
      this.adOptions.adId = 'ca-app-pub-3940256099942544/4411468910', // test from firebase, will be changed to actual in the constructor
      console.log('ios ad selected.');
    }
    else if (this.platform.is('android')) {
      this.adOptions.adId = 'ca-app-pub-3940256099942544/4411468910', // test from firebase, will be changed to actual in the constructor
      console.log('andoird ad selected.');
    }
```
