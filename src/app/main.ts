import {enableProdMode} from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
//import { AppModuleNgFactory } from '../../aot/src/app/app.module.ngfactory';

import { AppModule } from './app.module';

enableProdMode();
platformBrowserDynamic().bootstrapModule(AppModule);
//platformBrowserDynamic().bootstrapModuleFactory(AppModuleNgFactory);
