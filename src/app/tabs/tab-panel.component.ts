import { Directive, OnDestroy } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';

import { MenuCommand } from '../enums';
import { FormComponent } from '../ui-components';

@Directive()
export abstract class TabPanelComponent<TData> extends FormComponent implements OnDestroy {
  public titles$: Observable<[string, string]>;
  private _titles$: ReplaySubject<[string, string]> = new ReplaySubject<[string, string]>(1);
  private _title: string = '';
  private _fullTitle: string = '';
  private _data: TData | undefined;
  private _active: boolean = false;

  constructor() {
    super();

    this.titles$ = this._titles$.asObservable();
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();

    this._titles$.complete();
  }

  public abstract onCommand(menuCommand: MenuCommand, ...args: any[]): void;

  public get active(): boolean {
    return this._active;
  }
  public set active(active: boolean) {
    this._active = active;
  }

  public get title(): string {
    return this._title;
  }

  public get fullTitle(): string {
    return this._fullTitle;
  }

  public setTitle(title: string, fullTitle: string): void {
    this._title = title;
    this._fullTitle = fullTitle;

    this._titles$.next([title, fullTitle]);
  }

  public get data(): TData | undefined {
    return this._data;
  }
  public setData(data: TData | undefined): void {
    this._data = data;
  }
}
