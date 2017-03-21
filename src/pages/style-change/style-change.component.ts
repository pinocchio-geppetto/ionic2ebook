import { Component } from '@angular/core';

import { ViewController, NavParams } from 'ionic-angular';

@Component({
  selector: 'style-change',
  templateUrl: 'style-change.component.html'
})
export class StyleChange {
  public styleSelected: number;
  public priorStyleSelected: number;
  public readonly choiceOfStyles: {};
  public caption: string = '';
  public notify: (StyleChanged: number) => any;

  constructor(public viewCtrl: ViewController, private navParams: NavParams) {
    this.styleSelected = this.priorStyleSelected = this.navParams.get('styleBeforeChange');
    this.choiceOfStyles = this.navParams.get('choiceOfStyles');
    this.caption = this.navParams.get('caption')

    // rememeber the callback 
    this.notify = this.navParams.get('hasChanged');
  }

  public onStyleChange() {
    if (this.priorStyleSelected == this.styleSelected) return;
    this.priorStyleSelected = this.styleSelected;

    // notify parent of change
    this.notify(this.styleSelected);
  }
}
