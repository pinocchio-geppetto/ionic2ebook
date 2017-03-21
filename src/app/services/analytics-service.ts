import { Injectable } from '@angular/core';
import { Firebase } from 'ionic-native';

interface AnalyticsPageLog {
  fromPageNumber: number,
  totalPages: number
}

interface AnalyticsTocGotoLog {
  elementId: string,
  innerHTML: string
}

@Injectable()
export class AnalyticsService {
  
  constructor() {
  }

  public logEventScrollForwardOnePage(data : AnalyticsPageLog): void {
      if (Firebase) Firebase.logEvent('scrollForwardOnePage', data);
      console.log('tsc: Analytics logged logEventScrollForwardOnePage: ' + JSON.stringify(data));
  }

  public logEventScrollBackwardsOnePage(data : AnalyticsPageLog): void {
      if (Firebase) Firebase.logEvent('scrollBackwardsOnePage', data);
      console.log('tsc: Analytics logged scrollBackwardsOnePage: ' + JSON.stringify(data));
  }

  public logEventOnTocGoto(data: AnalyticsTocGotoLog): void {
      if (Firebase) Firebase.logEvent('onTocGoto', data);
      console.log('tsc: Analytics logged logEventOnTocGoto: ' + JSON.stringify(data));
  }
};
