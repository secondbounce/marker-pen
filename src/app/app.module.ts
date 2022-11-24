import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ApplicationRef, DoBootstrap, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { AppComponent } from './app.component';
import { TabPanelsModule } from './tabs/tab-panels/tab-panels.module';
import { TabstripModule } from './tabs/tabstrip/tabstrip.module';
import { ToolbarModule } from './ui-components/toolbar/toolbar.module';
import { MarkdownFileModule } from './views/markdown-file/markdown-file.module';

// AoT requires an exported function for factories
// eslint-disable-next-line @typescript-eslint/typedef
const httpLoaderFactory = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './assets/i18n/', '.json');

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
// TODO: probably not needed
    FormsModule,
    HttpClientModule,
    AngularSvgIconModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    MarkdownFileModule,
    TabPanelsModule,
    TabstripModule,
    ToolbarModule
  ],
  providers: [
  ],
  bootstrap: [/* See below */]
})
export class AppModule implements DoBootstrap {
  // constructor(private _injector: Injector) {}

  public ngDoBootstrap(appRef: ApplicationRef): void {
    /* In order to trigger this event handler so we can initialize the custom elements,
      the `bootstrap` property in the `@NgModule` decorator must be empty.  That therefore
      means that we have to manually bootstrap the app with `AppComponent`.
    */
    appRef.bootstrap(AppComponent);

    /* Register web components */
    //MessageBoxModule.define(this._injector);
  }
}
