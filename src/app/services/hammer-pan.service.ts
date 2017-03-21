import { Injectable } from '@angular/core';

export interface HammerPanEvent {
    offsetDirection: number;
    distance: number;
}

// class to handle panning by hammer.js, which is wrapped by Ionic
// computes angle and shawdow used to animate the page
@Injectable()
export class HammerPanService {
  // this is read from Hammer.js's even object. Just a cache.
  protected               offsetDirection: number = 0; // direction of the pan gesture

  public readonly         oneGestureDistance: number = 150; // max pan distance to flip a page

  // these are all based on the gesture panning from right to left, which is flipping the book forward
  public readonly      endDegreeToTransform: number = -90;   // how should the page at the end of a pan
  public readonly      startDegreeToTransform: number = 0;   // how should the page be at the start of a pan
  public readonly      endBrightnessToTransform: number = 1.0; // 100%, brightness of the bottom page at the end of a pan
  public readonly      startBrightnessToTransform: number = 0.85; // 85%, brightness of the bottom page at the start of a pan

  public startTransition(event: HammerPanEvent) {
    this.offsetDirection = event.offsetDirection;
  }

  // http://hammerjs.github.io/api/
  // DIRECTION_NONE	1
  // DIRECTION_LEFT	2
  // DIRECTION_RIGHT	4
  // DIRECTION_UP	8
  // DIRECTION_DOWN	16
  // DIRECTION_HORIZONTAL	6
  // DIRECTION_VERTICAL	24
  // DIRECTION_ALL	30
  public isPanLeft(): boolean { return (this.offsetDirection == 2); }
  public isPanRight(): boolean { return (this.offsetDirection == 4); }

  // how much a Pan has to move before it is considered a full and completed Pan
  protected validPanRange(): number {
    return (this.oneGestureDistance / 2);
  }

  // Chops the range [0..1] into 3 segments. Animate the first segment fast. The other 2 segments slow.
  protected getSpeed(normalised: number): string {
    return (normalised < 0.5) ? 'Fast' : 'Slow';
  }

  // distance = distance for pan to animate
  protected getAnimationSpeedFromDistance(distance: number) : string {
    // Error check
    if ((distance <= 0) || (distance > this.validPanRange())) {
      return '';
    }

    // compute amount of time to animate pan to fully turn page
    let normalised: number = distance / this.validPanRange();
    let speed: string = this.getSpeed(normalised);

    return speed;
  }

  public getAnimationSpeedOnCompletedPan(e: HammerPanEvent) : string {
    // distance not panned but should be panned
    let unpanned: number = this.oneGestureDistance - e.distance;

    return this.getAnimationSpeedFromDistance(unpanned);
  }

  public getAnimationSpeedOnIncompletedPan(e: HammerPanEvent) : string {
    // distance already panned but should be backtracked
    let panned: number = e.distance;

    return this.getAnimationSpeedFromDistance(panned);
  }

  // any pan that is greater than 1/2 the pan distance, and is in the same direction, is approx to a full pan
  public isPanCompleted(e: HammerPanEvent) {
    return ((e.distance >= this.validPanRange()) && (e.offsetDirection == this.offsetDirection));
  }

  // map distance to how many degrees to rotate, hence how much of the book to flip
  public getForwardsDegreeOfRotation(e: HammerPanEvent) : number {
    let   distance = e.distance;
    let   flipDegrees : number; // degrees to flip as the pan movement event continues to be emitted

    if ((distance > this.oneGestureDistance) && (e.offsetDirection == this.offsetDirection)) {
      // the pan movement has exceed the max pan distance, and is in the same direction of the original pan motion.
      // Pan has completed. Return max pan degrees.
      flipDegrees = this.endDegreeToTransform;
    }
    else if (e.offsetDirection != this.offsetDirection) {
      // the pan movement has went the opposite direction beyond the starting point. Return no pan animation (starting state).
      flipDegrees = this.startDegreeToTransform;
    }
    else {
      // compute how many degrees to transform, in total, for one gesture.
      // The equation below DOES NOT work for all [startDegreeToTransform, endDegreeToTransform] pairs but it works for this case!!
      let totalDegreesToTransform = this.startDegreeToTransform + this.endDegreeToTransform;
      // now we are sure distance is between [0, oneGestureDistance]
      flipDegrees = (distance/this.oneGestureDistance) * totalDegreesToTransform;
    }

    return flipDegrees;
  }

  // map distance to how many degrees to rotate, hence how much of the book to flip
  public getBackwardsDegreeOfRotation(e: HammerPanEvent) : number {
    return this.endDegreeToTransform - this.getForwardsDegreeOfRotation(e);
  }

  public getForwardsFilterBrightness(e: HammerPanEvent) : number {
    // normalise getForwardsDegreeOfRotation() into the range for brightness
    // this equation does not work for all [startBrightnessToTransform, endBrightnessToTransform] pairs but it works for this case!!
    let brightness : number = (this.endBrightnessToTransform - this.startBrightnessToTransform) / Math.abs(this.endDegreeToTransform - this.startDegreeToTransform);
    brightness = Math.abs(this.getForwardsDegreeOfRotation(e)) * brightness;
    return this.startBrightnessToTransform + brightness;
  }

  public getBackwardsFilterBrightness(e: HammerPanEvent) : number {
    // normalise getForwardsDegreeOfRotation() into the range for brightness
    // this equation does not work for all [startBrightnessToTransform, endBrightnessToTransform] pairs but it works for this case!!
    let brightness : number = (this.endBrightnessToTransform - this.startBrightnessToTransform) / Math.abs(this.endDegreeToTransform - this.startDegreeToTransform);
    brightness = Math.abs(this.getBackwardsDegreeOfRotation(e)) * brightness;
    return this.startBrightnessToTransform + brightness;
  }
}

