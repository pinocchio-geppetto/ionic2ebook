import { Injectable } from '@angular/core';
import { NativeStorage } from 'ionic-native';

// hack: to get around (i.e. disable) type checking
type AnyType = any;

// To store app persistent objects/states/data
// (1) write/read to/from NativeStorage
// (2) if (1) failes, write/read from memory
// This is necessary because this app may run on a browser... maybe...
@Injectable()
export class PersistentDataService {
  protected   db = {};

  protected getItemFailed(reference: string) {
    return this.db[reference];
  }

  protected getItem(reference: string): Promise<any> {
    let p = new Promise((resolve, reject) => {
      NativeStorage.getItem(reference).then(
        (data) => {
          resolve(data);
        },
        (error) => {
          resolve(this.getItemFailed(reference));
        }
      );
    });

    return p;
  }

  protected setItem(reference: string, value: AnyType) {
    NativeStorage.setItem(reference, value).then(
      () => { },
      (error) => { 
        this.db[reference] = value; 
      }
    );
  }

  ////////////////////////////////////////////////////////////////////////

  public setItemAppVersion(version: string) {
    this.setItem('PersistentAppVersion', version);
  }

  public setItemVideoColourIdSelected(id: number) {
    this.setItem('PersistentVideoColourIdSelected', id);
  }

  public getItemVideoColourIdSelected(): Promise<any> {
    return this.getItem('PersistentVideoColourIdSelected');
  }

  public setItemFontSelected(font: number) {
    this.setItem('PersistentFontSelected', font);
  }

  public getItemFontSelected(): Promise<any> {
    return this.getItem('PersistentFontSelected');
  }

  public setItemFontSizeSelected(size: number) {
    this.setItem('PersistentFontSizeSelected', size);
  }

  public getItemFontSizeSelected(): Promise<any> {
    return this.getItem('PersistentFontSizeSelected');
  }

  public getItemPageCoordinate(): Promise<any> {
    return this.getItem('PersistentPageCoordinate');
  }

  public setItemPageCoordinate(
              coordinate: number,
              relativePosition: number,
              columnWidth: number,
              height: number
  ): void {
    let data = {
          coordinate: coordinate,
          relativePosition: relativePosition,
          columnWidth: columnWidth,
          height: height
    };
    this.setItem('PersistentPageCoordinate', data);
  }
};
