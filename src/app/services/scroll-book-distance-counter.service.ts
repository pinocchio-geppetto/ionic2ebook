import { Injectable } from '@angular/core';

// class to compute how much to scroll one page at a time
@Injectable()
export class ScrollBookDistanceCounterService {
  protected current : number = null; // the coordinate of the current scroll position
  public sizePerColumn : number = null; // the column width
  public maxRightColumnLeftCoordinate : number = null; // the right most column, .left coordinate
  public maxRightColumnRightCoordinate : number = null; // the right most column, .right coordinate. as far to the right as possible.

  initialise(container : HTMLElement) {
    if (!container) return;
    
    let style = getComputedStyle(container);
    this.sizePerColumn = parseFloat(style.getPropertyValue('column-width'));

    /*
    A last <p> tag is needed in the HTML content to signify end of book.
    On the Safari browser, it is not able to return the correct coordinates (both .offsetLeft and getBoundingClientRect()) when the 
    last paragraph spans more than one column.
    */
    let rectFirst = container.firstElementChild.getBoundingClientRect();
    let rectLast = container.lastElementChild.getBoundingClientRect();
    let width = (rectLast.left - rectFirst.left) + this.sizePerColumn;
    this.maxRightColumnRightCoordinate = width;
    this.maxRightColumnLeftCoordinate = width - this.sizePerColumn;
  }

  public queryCoordinate(target : HTMLElement): number {
    return target.offsetLeft;
  }

  public scrollTo(target : HTMLElement) {
    this.current = target.offsetLeft;
    return this.current;
  }

  public scrollToCoordinate(coordinate : number): number {
    return (this.current = coordinate);
  }

  public canScrollOnePageToLeft() {
    return ((this.current - this.sizePerColumn) >= 0);
  }

  // look forward one page to the left while not scrolling beyond first column. Internal state not updated.
  public queryOnePageToLeft() : number {
    let newCurrent = this.current - this.sizePerColumn;
    if (newCurrent < 0) return this.current; // not to scroll beyond the starting point
    return newCurrent;
  }

  // scroll one page to the left while not scrolling beyond first column. Internal state updated.
  public scrollOnePageToLeft() : number {
    this.current = this.queryOnePageToLeft();
    return this.current;
  }

  public canScrollOnePageToRight() {
    return ((this.current + this.sizePerColumn) <= this.maxRightColumnLeftCoordinate);
  }

  // look forward one page to the right while not scrolling beyond last column. Internal state not updated.
  public queryOnePageToRight() : number {
    let newCurrent = this.current + this.sizePerColumn;
    if (newCurrent > this.maxRightColumnLeftCoordinate) return this.current; // not to scroll beyond the right most column
    return newCurrent;
  }

  // scroll one page to the right while not scrolling beyond last column. Internal state udpated.
  public scrollOnePageToRight() : number {
    this.current = this.queryOnePageToRight();
    return this.current;
  }

  // the current scroll position (current page)
  public getCurrentScrollPosition() {
    return this.current;
  }
}
