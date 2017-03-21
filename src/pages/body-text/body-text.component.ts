import { Component, ViewChild, ElementRef, AnimationTransitionEvent } from '@angular/core';
import { ChangeDetectorRef, Inject } from '@angular/core'; 
import { trigger, style, state, transition, animate } from '@angular/core'; // for animation use

import { DOCUMENT, DomSanitizer } from '@angular/platform-browser';

// Polyfills for Web Animations
import 'web-animations-js/web-animations.min';

import { Platform } from 'ionic-angular';
import { NavController, NavParams } from 'ionic-angular';
import { Content } from 'ionic-angular';
import { PopoverController } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';

import { Insomnia } from 'ionic-native';
import { StatusBar } from 'ionic-native';

import { GoToPageNumber } from '../go-to-page-number/go-to-page-number.component';
import { StyleChange } from '../style-change/style-change.component';

import { SmscBookContentComponent } from '../../app/components/smsc-book-content.component';
import { ScrollBookDistanceCounterService } from '../../app/services/scroll-book-distance-counter.service';
import { HammerPanService, HammerPanEvent } from '../../app/services/hammer-pan.service';
import { SemLockService } from '../../app/services/sem-lock.service';
import { PersistentDataService } from '../../app/services/persistent-data.service';
import { InterstitialAdsService } from '../../app/services/interstitial-ads.service';
import { AnalyticsService } from '../../app/services/analytics-service';

// hack: to get around (i.e. disable) type checking
type AnyType = any;

// animate() functions are "static" in that they are called one time and the parameters to animate() cannot be changed programmatically (that I know of)
// No need to animate filter (i.e. shadow) because it is not visible to the eye
@Component({
  selector: 'page-body-text',
  templateUrl: 'body-text.component.html',
  animations: [
    trigger('flipRightOrLeft', [
      transition('pageNeutral => pageUpFast', [
        animate('50ms', style({transform: 'rotateY(-90deg)'}))
      ]),
      transition('pageNeutral => pageUpSlow', [
        animate('100ms', style({transform: 'rotateY(-90deg)'}))
      ]),
      transition('pageNeutral => pageDownFast', [
        animate('50ms', style({transform: 'rotateY(0deg)'}))
      ]),
      transition('pageNeutral => pageDownSlow', [
        animate('100ms', style({transform: 'rotateY(0deg)'}))
      ])
    ]),
    trigger('flipManyPagesNow', [
      transition('pageNeutral => pageUpSlow', [
        animate('100ms', style({transform: 'rotateY(-90deg)'}))
      ])
    ]),
    // the reason transition(':enter',...) and transition(':leave',...) are not used is because there is a lag on browsers
    // <ion-header> needs time to load when it is deleted from the DOM using *ngIf and there is a lag effect to load <ion-header> on the first time animation is performed
    trigger('toolbarAppear', [
      state('hidden', style({transform: 'translateX(-100%)'})),
      state('appear', style({transform: 'translateX(0)'})),
      transition('hidden => appear', [
        animate('400ms ease-in')
      ]),
      transition('appear => hidden', [
        animate('400ms ease-out')
      ])
    ])
  ],
  providers: [  ScrollBookDistanceCounterService,
                HammerPanService,
                { provide: 'SemLockService1', useClass: SemLockService },
                { provide: 'SemLockService2', useClass: SemLockService },
                { provide: 'SemLockService3', useClass: SemLockService }
             ]
})
export class BodyText {
  @ViewChild(Content) content: Content;
  @ViewChild('topBookRef') topBook: ElementRef;
  @ViewChild('topPageRef') topPage: SmscBookContentComponent;

  // constants in this component
  protected static readonly beginningOfBookAnchor: string = 'Toc'; // the first page of a book.
  protected static readonly beginningOfBookContentAnchor: string = 'Preface'; // first page after the table of content. only page position after this anchor will be serialised

  // the computed width for css column
  public bookContentColumnWidth: number = null;
  // the right most coordinate of class=.tsc-book-content after the columns are sized
  public tscBookContentRightMostCoordinate: string = 'auto';
  // the "scrollLeft" of the book container div
  public scrollTopToPosition: number = 0;
  public scrollBottomToPosition: number = 0;
  // Animation, to animate panning left or right. Choice of states are: pageNeutral, pageUpFast, pageUpSlow, pageDownFast, pageDownSlow
  public flipRightOrLeftNow: string = "pageNeutral";
  // Animation, to animate flipping many pages when the Table of Content is clicked
  public flipManyPagesNow: string = "pageNeutral";
  // amount to rotate the book container div
  public transformCommand: string = 'transform: rotateY(0deg)';
  public filterCommand: string = 'brightness(50%)';
  // whether toolbar/ion-footer and ion-header should appear
  public toolbarAppear:string = 'hidden'; // either 'hidden' or 'appear'. 
  // promise used to synchronise and ensure ionViewDidLoad() runs before ionViewDidEnter()
  protected ionViewDidLoadResolved: Promise<any> = null;

  // font size selected for the book
  public readonly choiceOfFontSizes = [
    { label: '95%', style: {'font-size': '11px'}, binding: '11px' },
    { label: '100%', style: {'font-size': '14px'}, binding: '14px' },
    { label: '105%', style: {'font-size': '17px'}, binding: '17px' },
    { label: '110%', style: {'font-size': '20px'}, binding: '20px' }
  ];
  public fontSize: number = 1;
  // font selected for the book
  public readonly choiceOfFonts = [
    { label: 'Serif', style: {'font-family': 'Serif'}, binding: 'Serif' },
    { label: 'Sans-Serif', style: {'font-family': 'Sans-Serif'}, binding: 'Sans-Serif' },
    { label: 'Monospace', style: {'font-family': 'Monospace'}, binding: 'Monospace' },
    { label: 'Script', style: {'font-family': 'Script'}, binding: 'Script' }
  ];
  public font: number = 1;

  // background-color and color selected for the book (i.e. videoColour)
  public videoColours = [
    { label: 'White',
      binding: {
                  'tsc_video_colour_white': true,
                  'tsc_video_colour_cream': false,
                  'tsc_video_colour_gold': false,
                  'tsc_video_colour_dark_blue': false,
                  'tsc_video_colour_reverse': false
                },
      style: {}
    },
    /* { label: 'Cream',
      binding: {
                  'tsc_video_colour_white': false,
                  'tsc_video_colour_cream': true,
                  'tsc_video_colour_gold': false,
                  'tsc_video_colour_dark_blue': false,
                  'tsc_video_colour_reverse': false
                },
      style: {}
    }, */
    { label: 'Gold',
      binding: {
                  'tsc_video_colour_white': false,
                  'tsc_video_colour_cream': false,
                  'tsc_video_colour_gold': true,
                  'tsc_video_colour_dark_blue': false,
                  'tsc_video_colour_reverse': false
                },
      style: {}
    },
    { label: 'DarkBlue',
      binding: {
                  'tsc_video_colour_white': false,
                  'tsc_video_colour_cream': false,
                  'tsc_video_colour_gold': false,
                  'tsc_video_colour_dark_blue': true,
                  'tsc_video_colour_reverse': false
                },
      style: {}
    },
    { label: 'Reverse',
      binding: {
                  'tsc_video_colour_white': false,
                  'tsc_video_colour_cream': false,
                  'tsc_video_colour_gold': false,
                  'tsc_video_colour_dark_blue': false,
                  'tsc_video_colour_reverse': true
                },
      style: {}
    }
  ];
  public videoColourIdSelected: number = 0;

  constructor(public navCtrl: NavController,
              private navParams: NavParams,
              private sanitizer: DomSanitizer,
              private changeDetectorRef: ChangeDetectorRef,
              public platform: Platform,
              @Inject(DOCUMENT) private document : any, // ngc-failed: Document,
              public popoverCtrl: PopoverController,
              // to track the position of the scroll (i.e. page viewed) on the columns
              protected scrollBookDistanceCounter: ScrollBookDistanceCounterService,
              // to track the animation of panning the page of a book
              protected hammerPan: HammerPanService,
              // the LoadingController
              public loadingCtrl: LoadingController, 
              // whether animation is in progress
              @Inject('SemLockService1') protected animationLock: SemLockService,
              // whether transiston is in progress (which includes animation)
              @Inject('SemLockService2') protected transitionLock: SemLockService,
              // whether <ion-header> and command palette floats on top of book
              @Inject('SemLockService3') protected commandPaletteModeLock: SemLockService,
              protected persistentDataService: PersistentDataService,
              protected interstitialAdsService: InterstitialAdsService,
              protected analyticsService: AnalyticsService
  ) {
    let style:any = this.sanitizer.bypassSecurityTrustStyle(this.transformCommand);
    this.transformCommand = style;

    StatusBar.hide();
  }

  // to show page number on the book
  public getTotalPagesForDisplayOnBook() {
    if ((!this.scrollBookDistanceCounter.maxRightColumnRightCoordinate) || (!this.scrollBookDistanceCounter.sizePerColumn)) {
      return 0;
    }
    let rightMostCoordinate = this.scrollBookDistanceCounter.maxRightColumnRightCoordinate;
    let sizePerColumn = this.scrollBookDistanceCounter.sizePerColumn;
    return Math.round(rightMostCoordinate / sizePerColumn);
  }

  // to show page number on the book
  public getCurrentTopPageForDisplayOnBook() {
    if (!this.scrollBookDistanceCounter.sizePerColumn) {
      return 0;
    }
    return Math.round((this.scrollTopToPosition / this.scrollBookDistanceCounter.sizePerColumn) + 1);
  }

  // to show page number on the book
  public getCurrentBottomPageForDisplayOnBook() {
    if (!this.scrollBookDistanceCounter.sizePerColumn) {
      return 0;
    }
    return Math.round((this.scrollBottomToPosition / this.scrollBookDistanceCounter.sizePerColumn) + 1);
  }

  // callback from the table of contents when one of the table of content links are clicked
  public onTocGoto(anchor: string) {
    // There can be no jumping to any table of content if panning is in progress
    if (this.transitionLock.isLocked()) return;
    // no jumping to any table of content if animation is in progress
    if (this.animationLock.isLocked()) return;
    // no jumping to any table of content if in command palette mode (not in full screen mode)
    if (this.commandPaletteModeLock.isLocked()) return;

    // This is a hack. When any table of content item is tapped, two events will fire:
    // 1) an event for the click on table of content
    // 2) an event for clicking on .tsc_book_content_container
    // Locking here will allow event (2) to unlock, achieving the desired "this.commandPaletteModeLock" unlocked mode
    this.commandPaletteModeLock.lock();

    this.animationLock.lock();
    this.animationLock.startCounter();
    this.animationLock.saveData(anchor); // save the anchor name
    setTimeout(()=>{ this.animateToAnchor(); }, 0);
  }

  // begin animation of turning many pages.
  public animateToAnchor() {
    if (this.animationLock.getCounter() == 8) {
      this.animationLock.unlock();
      this.scrollToAnchor(this.animationLock.getData());
    }
    else {
      this.flipManyPagesNow = 'pageUpSlow';
      this.animationLock.incrCounter();
    }
  }

  // callback. End of animation 'flipManyPagesNowDone'
  public flipManyPagesNowDone(e: AnimationTransitionEvent) {
    if ((e.fromState === 'pageNeutral') && (e.toState.includes('pageUpSlow'))) {
      this.scrollForwardOnePage();
      this.flipManyPagesNow = 'pageNeutral';
      this.changeDetectorRef.detectChanges();
      setTimeout(()=>{this.animateToAnchor();}, 0);
    }
  }

  // scroll to the coordinate
  protected scrollToCoordinate(coordinate: number) {
    this.scrollBookDistanceCounter.scrollToCoordinate(coordinate);
    this.scrollTopToPosition = coordinate;
    this.scrollBottomToPosition = coordinate;

    // if the user is at Toc, do not remember this as the last persistent location to go back.
    let element: HTMLElement = this.document.getElementById(BodyText.beginningOfBookContentAnchor);
    let minCoordinate: number = this.scrollBookDistanceCounter.queryCoordinate(element);
    if (coordinate > minCoordinate) {
      this.persistentDataService.setItemPageCoordinate(
              coordinate,
              coordinate / this.scrollBookDistanceCounter.maxRightColumnLeftCoordinate,
              this.scrollBookDistanceCounter.sizePerColumn,
              this.topPage.elementRef.nativeElement.style.height );
    }
  }

  // Scrolls to the element
  protected scrollToElement(targetElement: HTMLElement) {
    if (targetElement == null) { return; }
    let scrollToHere = this.scrollBookDistanceCounter.scrollTo(targetElement);
    this.scrollToCoordinate(scrollToHere);
  }

  // Scrolls to anchor denoted by anchorToJumpTo
  protected scrollToAnchor(anchorToJumpTo: string) {
    let elementToJumpTo: HTMLElement = this.document.getElementById(anchorToJumpTo);
    this.scrollToElement(elementToJumpTo);

    this.analyticsService.logEventOnTocGoto({
      elementId: anchorToJumpTo,
      innerHTML: elementToJumpTo.innerHTML
    });
  }

  // size the div where the css column resides
  sizeSmscBookContent() {
    this.scrollBookDistanceCounter.initialise(this.topPage.elementRef.nativeElement);
    this.tscBookContentRightMostCoordinate = this.scrollBookDistanceCounter.maxRightColumnRightCoordinate + 'px';
    this.changeDetectorRef.detectChanges();
  }

  ionViewDidLeave() {
    // allow the screen to auto turn-off again.
    if (Insomnia) Insomnia.allowSleepAgain();
  }

  navigate(anchorToScrollTo: string, alternateAnchorToScrollTo: string) {
    // Priority 1: scroll to first page of book (i.e. "Toc" or Table of Content).
    if ((!!anchorToScrollTo)) {
      this.scrollToAnchor(anchorToScrollTo);
    }
    else {
      // user may quit with portrait orientation and start app up in landscape orientation
      this.persistentDataService.getItemPageCoordinate().then((data) =>{
        if (!data) {
          // app runs for first time
          alternateAnchorToScrollTo = (!!alternateAnchorToScrollTo ? alternateAnchorToScrollTo : BodyText.beginningOfBookContentAnchor);
          this.scrollToAnchor(alternateAnchorToScrollTo);
        }
        else if (data.height == this.topPage.elementRef.nativeElement.style.height &&
                 data.columnWidth == this.scrollBookDistanceCounter.sizePerColumn) {
            // no change in orientation of device. Just jump to cooridnate and all is well
            this.scrollToCoordinate(data.coordinate);
        }
        else {
          // Since orientation has changed, page numbers and position within the book will change. Try to position to the closest possible page.
          // Remember current normalised position
          this.scrollToRelativePosition(data.relativePosition);
        }
      });
    }
    console.log('tsc: navigate() done');
  }

  ionViewDidEnter2() {
    console.log('tsc: ionViewDidEnter() begin');

    // There is a behavior in the Safari browser.
    // Situation => (1) borders and margins are set using "em" and not fixed "px" units. (2) A new font is set in the css file, which is not the default.
    // In ionViewDidLoad(), sizing of css column-width is still done using the initial font size but !! displayed using new font size.
    // Calling "this.content.getNativeElement().style.fontSize = '18px'" does not make the situation better.
    // Works in Chrome.
    // Workaround: set border and margin in fixed size "px" units.

    // load ad and prepare for display
    this.interstitialAdsService.prepare();

    // do not turn off the screen. In reading mode
    if (Insomnia) Insomnia.keepAwake();

    // size the columns according to screen size
    // this must be called here and not in ionViewDidLoad(). Will not work on browsers if called in ionViewDidLoad() but works on ios and android.
    this.sizeSmscBookContent();
    console.log('tsc: end sizeSmscBookContent()');

    let alternateAnchorToScrollTo = this.navParams.get('alternateID');
    this.navigate(null, alternateAnchorToScrollTo);
  }

  ionViewDidEnter() {
    if (this.ionViewDidLoadResolved) {
      this.ionViewDidLoadResolved.then(() => {
        this.ionViewDidEnter2();
        this.ionViewDidLoadResolved = null;

        // this is needed because, sometimes, Safari on the iPhone will chop off 10% of the last line and
        // dispaly it on the next column when these texts are displayed in a css-column. Reinitialising will
        // cause it to recompute and display correctly
        // Could have used Renderer, which will save 50% CPU by saving one round of initialisation but Angular recommend ChangeDetectorRef
        if (this.platform.is('ios')) {
          let allFonts: number = this.choiceOfFonts.length;
          let oldFont: number = this.font;
          let newFont: number = (oldFont + 1) % allFonts;
          this.font = newFont;
          this.changeDetectorRef.detectChanges();
          setTimeout(()=>{
            this.font = oldFont;
            this.changeDetectorRef.detectChanges();
            console.log('font reinitialised on ios');
          }, 0);
        }
      });
    }
    else {
      this.ionViewDidEnter2();
    }
  }

  computeBookContentColumnWidth() {
    // find border-width and padding-width (padding-width should be zero)
    let style = getComputedStyle(this.topBook.nativeElement);
    let spacingWidth = parseFloat(style.getPropertyValue('border-right')) + parseFloat(style.getPropertyValue('border-left')) +
                       parseFloat(style.getPropertyValue('padding-right')) + parseFloat(style.getPropertyValue('padding-left'));
 
    // width of .tsc_book_content_container
    let containerWidth = this.topBook.nativeElement.offsetWidth;

    // set column-width to be (.tsc_book_content_container - paddings&borders)
    this.bookContentColumnWidth = containerWidth - spacingWidth;
  }

  ionViewDidLoad() {
    console.log('tsc: ionViewDidLoad() begin initialisation');

    this.ionViewDidLoadResolved = new Promise((resolve)=>{
      this.persistentDataService.getItemVideoColourIdSelected().then((v) => {
        if (v) this.videoColourIdSelected = v; /* else rely on default */
        return this.persistentDataService.getItemFontSelected();
      }).then( (v) => {
        if (v) this.font = v; /* else rely on default */ 
        return this.persistentDataService.getItemFontSizeSelected();
      }).then( (v) => {
        if (v) this.fontSize = v; /* else rely on default */
        console.log('tsc: ionViewDidLoad() end initialisation');

        this.computeBookContentColumnWidth();
        console.log('tsc: ionViewDidLoad() end sizing css column in initialisation');

        resolve(true);
      });
    });
  }

  onResize() {
    // Since orientation has changed, page numbers and position within the book will change. Try to position to the closest possible page.
    // Remember current normalised position
    let current = this.scrollBookDistanceCounter.getCurrentScrollPosition();
    let relativePosition = current / this.scrollBookDistanceCounter.maxRightColumnLeftCoordinate;

    this.computeBookContentColumnWidth();
    this.tscBookContentRightMostCoordinate = 'auto';
    // when resizing from the browser (not a mobile and this is Ionic made to run on a mobile only), 
    // when this app is placed inside a fixed size div, and the browser window is much bigger than this app,
    // .tsc_book_content_container_scroll will reinitialise itself to a scrollLeft of 0
    // this is to mimic this behavior so that the next call to this.scrollToRelativePosition(relativePosition) will
    // actually detect a change and apply the new position/coordinate
    this.scrollToCoordinate(0);
    this.changeDetectorRef.detectChanges();
    this.scrollToRelativePosition(relativePosition);
    this.changeDetectorRef.detectChanges();
  }

  // the assumption is topPage and "bottomPage" will always be sync'ed and pointing to the same page until a pan event happens
  // this function will update the page pointer to the subsequent page
  public scrollBackwardsOnePage() {
    const newScrollLeft = this.scrollBookDistanceCounter.scrollOnePageToLeft();
    this.scrollToCoordinate(newScrollLeft);
  }
  
  // the assumption is topPage and "bottomPage"" will always be sync'ed and pointing to the same page until a pan event happens
  // this function will update the page pointer to the subsequent page
  public scrollForwardOnePage() {
    const newScrollLeft = this.scrollBookDistanceCounter.scrollOnePageToRight();
    this.scrollToCoordinate(newScrollLeft);
  }

  // put together the transform:rotate(x) CSS function
  protected makeTransformCommand(angle : number) : string {
    return 'rotateY(' + angle.toString() + 'deg)';
  }

  // put together the filter:brightness(x) CSS function
  protected makeFilterCommand(brightness : number) : string {
    return 'brightness(' + brightness.toString() + ')';
  }

  public onTapped(e: HammerPanEvent) {
    if (this.commandPaletteModeLock.isLocked()) {
      this.toolbarAppear = 'hidden';
      this.commandPaletteModeLock.unlock();
    }
    else { // if (!this.commandPaletteModeLock.isLocked()) {
      this.commandPaletteModeLock.lock();
      this.toolbarAppear = 'appear';
    }
  }

  // start of pan action
  public onPanStart(e: HammerPanEvent) {
    // If thre is an existing pan or animation, do nothing.
    if (this.transitionLock.isLocked()) return;
    // no panning if animation is in progress
    if (this.animationLock.isLocked()) return;
    // no panning if in command palette mode (not in full screen mode)
    // allow panning even in command mode due to user feedback.
    //if (this.commandPaletteModeLock.isLocked()) return;

    this.hammerPan.startTransition(e);
    this.transitionLock.lock();

    // if panning right or left, set the page correctly.
    if (this.hammerPan.isPanLeft()) {
      // no scrolling to a prior page if is first page
      if (! this.scrollBookDistanceCounter.canScrollOnePageToRight()) {
        this.transitionLock.unlock();
        return;
      }

      // bottom page should show next page
      this.scrollBottomToPosition = this.scrollBookDistanceCounter.queryOnePageToRight();
      // no need to call this.transformCommand = this.makeTransformCommand(this.hammerPan.startDegreeToTransform) because this is original start state
      this.filterCommand = this.makeFilterCommand(this.hammerPan.startBrightnessToTransform);
    }
    else { // if (this.hammerPan.isPanRight()) {
      // no scrolling past last page if it is already last page
      if (! this.scrollBookDistanceCounter.canScrollOnePageToLeft()) {
        this.transitionLock.unlock();
        return;
      }

      // top page should show previous page and rotated by -90deg
      this.scrollTopToPosition = this.scrollBookDistanceCounter.queryOnePageToLeft();
      this.transformCommand = this.makeTransformCommand(this.hammerPan.endDegreeToTransform);
      this.filterCommand = this.makeFilterCommand(this.hammerPan.endBrightnessToTransform);
    }
  }

  // end of pan. Clean up and reinitialise all.
  public onPanEnd(e: HammerPanEvent) {
    // There can be no panning unless there is a prior panstart. Else, ignore event.
    if (! this.transitionLock.isLocked()) return;
    // no panning if animation is in progress
    if (this.animationLock.isLocked()) return;
    // no panning if in command palette mode (not in full screen mode)
    // allow panning even in command mode due to user feedback.
    //if (this.commandPaletteModeLock.isLocked()) return;

    // check criteria to assume a complete pan.
    if (this.hammerPan.isPanCompleted(e)) { 
      // when pan is done but page not fully flipped, animate the rest of the motion
      let speed = this.hammerPan.getAnimationSpeedOnCompletedPan(e);

      if (this.hammerPan.isPanLeft()) {
        this.flipRightOrLeftNowStart('pageUp' + speed); // transition from pageNeutral to pageUp<x>
      }
      else { // (this.hammerPan.isPanRight())
        this.flipRightOrLeftNowStart('pageDown' + speed); // transition from pageNeutral to pageDown<x>
      }
    }
    // else assume no pan action.
    else {  // This is an incomplete pan. Revert to original unpanned state
      // when pan is done but page not fully flipped, animate the rest of the motion
      let speed = this.hammerPan.getAnimationSpeedOnIncompletedPan(e);

      if (this.hammerPan.isPanLeft()) {
        this.flipRightOrLeftNowStart('pageDown' + speed); // transition from pageNeutral to pageDown<x>
      }
      else { // (this.hammerPan.isPanRight())
        this.flipRightOrLeftNowStart('pageUp' + speed); // transition from pageNeutral to pageUp<x>
      }
    }
  }

  // sets the state for Animation to start during next change detection cycle
  public flipRightOrLeftNowStart(state: string) {
        this.flipRightOrLeftNow = state;
        this.animationLock.lock();
  }

  // callback. End of animation 'flipRightOrLeftNow'
  public flipRightOrLeftNowDone(e: AnimationTransitionEvent) {
    if ((e.fromState === 'pageNeutral') && (e.toState.includes('pageUp'))) {
      if (this.hammerPan.isPanLeft()) {
        this.scrollForwardOnePage();
        this.analyticsService.logEventScrollForwardOnePage(
          { fromPageNumber: this.getCurrentTopPageForDisplayOnBook(),
            totalPages: this.getTotalPagesForDisplayOnBook() }
        );
      }
      else { // this means pan operation did not complete. go back to original pre-pan action
        this.scrollTopToPosition = this.scrollBookDistanceCounter.getCurrentScrollPosition();
      }
    }
    else if ((e.fromState === 'pageNeutral') && (e.toState.includes('pageDown'))) {
      if (this.hammerPan.isPanRight()) {
        this.scrollBackwardsOnePage();
        this.analyticsService.logEventScrollBackwardsOnePage(
          { fromPageNumber: this.getCurrentTopPageForDisplayOnBook(),
            totalPages: this.getTotalPagesForDisplayOnBook() }
        );
      }
    }

    this.flipRightOrLeftNow = 'pageNeutral'; // reset to pageNeutral

    // rotate to original state, 0deg
    this.transformCommand = this.makeTransformCommand(this.hammerPan.startDegreeToTransform);
    // brightness to original filter:brightness(100%)
    this.filterCommand = this.makeFilterCommand(this.hammerPan.endBrightnessToTransform);

    this.transitionLock.unlock();
    this.animationLock.unlock();

    // show ad according to default interval
    this.interstitialAdsService.show();
  }

  // Panning left, in motion
  public onPanLeft(e: HammerPanEvent) {
    // There can be no panLeft unless there is a prior panstart. Else, ignore event.
    if (! this.transitionLock.isLocked()) return;
    // no panning if animation is in progress
    if (this.animationLock.isLocked()) return;
    // no panning if in command palette mode (not in full screen mode)
    // allow panning even in command mode due to user feedback.
    //if (this.commandPaletteModeLock.isLocked()) return;

    // rotate according to user pan movement
    if (this.hammerPan.isPanLeft()) {
      let degreeOfRotation : number = this.hammerPan.getForwardsDegreeOfRotation(e);
      this.transformCommand = this.makeTransformCommand(degreeOfRotation);

      // set the bottom page brightness according to rotation
      let brightnessOfFilter : number = this.hammerPan.getForwardsFilterBrightness(e);
      this.filterCommand = this.makeFilterCommand(brightnessOfFilter);
    }
    else { // (this.hammerPan.isPanRight())
      let degreeOfRotation : number = this.hammerPan.getBackwardsDegreeOfRotation(e);
      this.transformCommand = this.makeTransformCommand(degreeOfRotation);

      // set the bottom page brightness according to rotation
      let brightnessOfFilter : number = this.hammerPan.getBackwardsFilterBrightness(e);
      this.filterCommand = this.makeFilterCommand(brightnessOfFilter);
    }
  }

  // Panning right, in motion
  public onPanRight(e: HammerPanEvent) {
    // There can be no panLeft unless there is a prior panstart. Else, ignore event.
    if (! this.transitionLock.isLocked()) return;
    // no panning if animation is in progress
    if (this.animationLock.isLocked()) return;
    // no panning if in command palette mode (not in full screen mode)
    // allow panning even in command mode due to user feedback.
    //if (this.commandPaletteModeLock.isLocked()) return;

    // rotate according to user pan movement
    if (this.hammerPan.isPanLeft()) {
      let degreeOfRotation : number = this.hammerPan.getForwardsDegreeOfRotation(e);
      this.transformCommand = this.makeTransformCommand(degreeOfRotation);

      // set the bottom page brightness according to rotation
      let brightnessOfFilter : number = this.hammerPan.getForwardsFilterBrightness(e);
      this.filterCommand = this.makeFilterCommand(brightnessOfFilter);
    }
    else { // (this.hammerPan.isPanRight())
      let degreeOfRotation : number = this.hammerPan.getBackwardsDegreeOfRotation(e);
      this.transformCommand = this.makeTransformCommand(degreeOfRotation);

      // set the bottom page brightness according to rotation
      let brightnessOfFilter : number = this.hammerPan.getBackwardsFilterBrightness(e);
      this.filterCommand = this.makeFilterCommand(brightnessOfFilter);
    }
  }

  // something has changed in the book and resulted in sizing change. Recompute layout. Reposition book pointer to best possible guess.
  scrollToRelativePosition(relativePosition: number) {
    // re-initialise internal data structures on the book
    this.sizeSmscBookContent();

    // reset current page pointer to the closest possible before the change
    let current: number = Math.round(relativePosition * this.scrollBookDistanceCounter.maxRightColumnLeftCoordinate);
    let columnWidth: number = this.scrollBookDistanceCounter.sizePerColumn;

    // decide whether to search up or down
    let remainder: number = current % columnWidth;
    let command2 = ((remainder / columnWidth) >= 0.5);

    // current page may have changed. if true, go back one page
    for (let i = current; i >= 0; command2 ? i++ : i-- ) {
      if ((i % columnWidth) == 0) {
        this.scrollToCoordinate(i);
        break;
      }
    }    
  }

  // user clicked to request popover for font size change
  onFontSizeChange(event: MouseEvent) {
    let popover = this.popoverCtrl.create(
                    StyleChange,
                    { hasChanged: (size: number)=>{this.fontSizeHasChanged(size);},
                      styleBeforeChange: this.fontSize,
                      choiceOfStyles: this.choiceOfFontSizes,
                      caption: 'Font Size' }
                  );
    popover.present({ev: event});
  }

  // callback from the PopoverController. font-size has changed. Set it accordingly.
  fontSizeHasChanged(size: number) {
    // if font size did not change from before the popover was presented, then do nothing
    if (this.fontSize == size) return;

    // showing the "busy I am processing" indicator
    let loading = this.loadingCtrl.create({});

    loading.present().then(()=>{
      // remember this as persistent
      this.persistentDataService.setItemFontSizeSelected(size);

      // Since font size has changed, page numbers and position within the book will change. Try to position to the closest possible page.
      // Remember current normalised position
      let current = this.scrollBookDistanceCounter.getCurrentScrollPosition();
      let relativePosition = current / this.scrollBookDistanceCounter.maxRightColumnLeftCoordinate;

      // apply the font size change
      this.fontSize = size;
      this.changeDetectorRef.detectChanges();

      this.scrollToRelativePosition(relativePosition);

      loading.dismiss();
    });
  }

  // user clicked to request popover for font change
  onFontChange(event: MouseEvent) {
    let popover = this.popoverCtrl.create(
                    StyleChange,
                    { hasChanged: (font: number)=>{this.fontHasChanged(font);},
                      styleBeforeChange: this.font,
                      choiceOfStyles: this.choiceOfFonts,
                      caption: 'Font' }
                  );
    popover.present({ev: event});
  }

  // callback from the PopoverController. font family has changed. Set it accordingly.
  fontHasChanged(font: number) {
    // if font did not change from before the popover was presented, then do nothing
    if (this.font == font) return;

    // showing the "busy I am processing" indicator
    let loading = this.loadingCtrl.create({});

    loading.present().then(()=>{
      // remember this as persistent
      this.persistentDataService.setItemFontSelected(font);

      // Since font has changed, page numbers and position within the book will change. Try to position to the closest possible page.
      // Remember current normalised position
      let current = this.scrollBookDistanceCounter.getCurrentScrollPosition();
      let relativePosition = current / this.scrollBookDistanceCounter.maxRightColumnLeftCoordinate;

      // apply the font change
      this.font = font;
      this.changeDetectorRef.detectChanges();

      this.scrollToRelativePosition(relativePosition);

      loading.dismiss();
    });
  }

  // user clicked to request video color change
  onVideoColourChange(event: MouseEvent) {
    let popover = this.popoverCtrl.create(
                    StyleChange,
                    { hasChanged: (videoColourIdSelected: number)=>{this.videoColourHasChanged(videoColourIdSelected) },
                      styleBeforeChange: this.videoColourIdSelected,
                      choiceOfStyles: this.videoColours,
                      caption: 'Colour'
                    }
                  );
    popover.present({ ev: event });
  }

  // callback from the PopoverController. page number has changed. Set it accordingly.
  videoColourHasChanged(videoColourIdSelected: number) {
    // if videoColor did not change from before the popover was presented, then do nothing
    if (this.videoColourIdSelected == videoColourIdSelected) return;

    // showing the "busy I am processing" indicator
    let loading = this.loadingCtrl.create({});

    loading.present().then(()=>{
      // remember this as persistent
      this.persistentDataService.setItemVideoColourIdSelected(videoColourIdSelected);
      // apply the videoColor change
      this.videoColourIdSelected = videoColourIdSelected;

      loading.dismiss();
    });
  }

  // user clicked to request popover for "go to page number"
  onGoToPageNumber(event: MouseEvent) {
    let popover = this.popoverCtrl.create(
                    GoToPageNumber,
                    { hasChanged: (pageNumber: number)=>{this.pageNumberHasChanged(pageNumber) },
                      rangeMin: 1,
                      rangeMax: this.getTotalPagesForDisplayOnBook(),
                      rangeCurrent: this.getCurrentTopPageForDisplayOnBook()
                    }
                  );
    popover.present({ev: event});
  }

  // callback from the PopoverController. page number has changed. Set it accordingly.
  pageNumberHasChanged(pageNumber: number) {
    // do not scroll beyond first page
    if (pageNumber < 1) pageNumber = 1;

    let coordinate = (pageNumber - 1) * this.scrollBookDistanceCounter.sizePerColumn;

    // do not scroll beyond last page
    if (coordinate > this.scrollBookDistanceCounter.maxRightColumnRightCoordinate) {
      coordinate = this.scrollBookDistanceCounter.maxRightColumnRightCoordinate;
    }

    this.scrollToCoordinate(coordinate);
  }
}
