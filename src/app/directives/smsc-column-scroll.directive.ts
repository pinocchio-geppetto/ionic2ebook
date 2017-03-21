import { Directive, ElementRef, Input } from '@angular/core';
import { SimpleChange, SimpleChanges, Renderer } from '@angular/core';

// Scrolls the book in pixels. The container decides the coordinate to scroll to. This directive does the scroll.
@Directive({
  selector: '[smscColumnScroll]',
  exportAs: 'smscColumnScroll'
 })
export class SmscColumnScrollDirective {
  @Input('smscColumnScroll') scrollLeft: string;

  constructor(private el: ElementRef, private renderer : Renderer) {
  }
  
  ngOnChanges(changes: SimpleChanges) {
    let change : SimpleChange = changes['scrollLeft'];
    if (change) {
      this.scrollTo(change.currentValue);
    }
  }

  // Enables and disables scrolling
  // Javascript documentation says ScrollLeft properties will only work if scrolling is enabled.
  // Testing says it does not need to be so. But it is better to follow documentation.
  protected enableScroll(enable: boolean) {
    const option : string = enable ? 'scroll' : 'hidden';
    this.renderer.setElementStyle(this.el.nativeElement, 'overflowX', option);
  }

  // do the actual scrolling to the coordinate denoted by scrollToHere
  protected setScrollLeft(scrollToHere : number) {
    this.enableScroll(true);
    this.renderer.setElementProperty(this.el.nativeElement, 'scrollLeft', scrollToHere.toString());
    this.enableScroll(false);
  }

  // scrolls to the position
  scrollTo(position: number) {
    this.setScrollLeft(position);
  }
}
