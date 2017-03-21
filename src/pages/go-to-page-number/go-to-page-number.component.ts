import { Component, Renderer } from '@angular/core';

import { ViewController, NavParams } from 'ionic-angular';

@Component({
  selector: 'go-to-page-number',
  templateUrl: 'go-to-page-number.component.html'
})
export class GoToPageNumber {
  public currentBookPageNumber: number;
  public bookPagesStart: number;
  public bookPagesEnd: number;
  public notify: (goToPageNumber: number) => {};

  constructor(public viewCtrl: ViewController,
              private navParams: NavParams,
              private renderer: Renderer) {
    // subscritbe to "willEnter" event
    viewCtrl.willEnter.subscribe(()=>{ setTimeout(()=>{this.initialise();},0); });

    this.notify = this.navParams.get('hasChanged');

    // initialise parameters to show pages on book correctly
    this.bookPagesStart = this.navParams.get('rangeMin');
    this.bookPagesEnd = this.navParams.get('rangeMax');
    this.currentBookPageNumber = this.navParams.get('rangeCurrent');
  }

  initialise() {
    let thisView = this.viewCtrl.pageRef();
    let container = thisView.nativeElement.getElementsByClassName('popover-content');
    // there should always be one and only one "popover-content"
    container = container[0];

    // size the popover to be about as wide as possible
    this.renderer.setElementStyle(container, 'width', 'auto');
    this.renderer.setElementStyle(container, 'left', '2em');
    this.renderer.setElementStyle(container, 'right', '2em');
  }

  public onPageChange() {
    this.notify(this.currentBookPageNumber);
  }
}
