import { Injectable } from '@angular/core';

// As in a semaphore. Lock and unlock.
// Also a counter
// 
@Injectable()
export class SemLockService {
  protected   locked: boolean = false;
  protected   i: number = 0;
  protected   data: any = null;

  // the semaphore
  public lock(): boolean { return (this.locked = true); }
  public unlock(): boolean { return (this.locked = false); }
  public isLocked(): boolean { return (this.locked); }

  // counter
  public startCounter(): number { return this.i = 1; }
  public incrCounter(): number { return this.i += + 1; }
  public getCounter(): number { return this.i; }

  // storage
  public saveData(data: any) { this.data = data; }
  public getData() : any { return this.data; }
};
