import { Directive, ElementRef } from '@angular/core';
import { Renderer } from '@angular/core';

// Because HTML requires all IDs to be unique and this book is inserted two times
// (one for front and one for bottom), the bottom book should have its IDs removed.
@Directive({
  selector: '[smscClearIds]',
  exportAs: 'smscClearIds'
 })
export class SmscClearIdsDirective {

  constructor(private el: ElementRef, private renderer : Renderer) {
  }

  // Because HTML requires all IDs to be unique and this book is inserted two times
  // (one for front and one for bottom), the bottom book should have its IDs removed.
  public clearIDs() {
    let ancestor = this.el.nativeElement;
    let descendents = ancestor.getElementsByTagName('*');

    let i: number;
    let e: Node;
    for (i = 0; i < descendents.length; ++i) {
      e = descendents[i];
      // Attempting to remove an attribute that is not on the element doesn't raise an exception.
      // Can't use Renderer to abstract and setting to null is not the right option
      // Create own abstraction, time permitting
      this.renderer.invokeElementMethod(e, 'removeAttribute', ['id']); 
    }
  }

  ngOnInit() {
    this.clearIDs();
  }
}
