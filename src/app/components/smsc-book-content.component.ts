// This is made a component. It is independent of Ionic
// Reason is because Angular does not allow <ng-include></ng-include> to be used 2 times
// It is either a bug or a feature. No decisions from Angular yet.
// This will be manually included to simulate front-page and bottom-page of book flipiping/animation

import { Component, ElementRef, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'smsc-book-content',
  templateUrl: 'smsc-book-content.component.html'
})
export class SmscBookContentComponent {
  @Output() TocGoTo = new EventEmitter();

  constructor(public elementRef: ElementRef) {
  }

  public goTo(anchor: string) {
    this.TocGoTo.emit( { id: anchor } );
  }
}
