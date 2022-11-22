import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';

import { AppComponent } from './app.component';
import { ElectronService } from './services';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
              declarations: [
                AppComponent
              ],
              providers: [
                ElectronService
              ],
              imports: [
                RouterTestingModule,
                TranslateModule.forRoot()
              ]
            })
           .compileComponents();
  }));

  it('should create the app', waitForAsync(() => {
    const fixture: ComponentFixture<AppComponent> = TestBed.createComponent(AppComponent);
    const app: AppComponent = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
