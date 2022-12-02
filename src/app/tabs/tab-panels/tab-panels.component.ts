import { Component, ComponentRef, OnDestroy, ViewChild, ViewContainerRef, ViewEncapsulation, ViewRef } from '@angular/core';
import { Observable } from 'rxjs';

import { MenuCommand } from 'src/app/enums';
import { TabManagerService } from '../../services';
import { TabPanel } from '../tab-panel';
import { TabPanelComponent } from '../tab-panel.component';
import { TabPanelsDirective } from './tab-panels.directive';

@Component({
  selector: 'app-tab-panels',
  template: '<ng-template appTabPanels></ng-template>',
  styleUrls: ['./tab-panels.component.scss'],
  encapsulation: ViewEncapsulation.None   /* To ensure CSS is applied to dynamically-loaded components */
})
export class TabPanelsComponent implements OnDestroy {
  @ViewChild(TabPanelsDirective, {static: true}) private _tabPanelHost!: TabPanelsDirective;
  private _componentRefs: Map<string, ComponentRef<TabPanelComponent<any>>> = new Map<string, ComponentRef<TabPanelComponent<any>>>();

  constructor(tabManagerService: TabManagerService) {
    tabManagerService.registerOpenTabHandler(this.openTab);
    tabManagerService.registerSwitchToTabHandler(this.switchToTab);
    tabManagerService.registerCloseTabHandler(this.closeTab);
    tabManagerService.registerCommandHandler(this.sendCommand);
  }

  public ngOnDestroy(): void {
    this._tabPanelHost.viewContainerRef.clear();
  }

  private openTab = (tabPanel: TabPanel): Observable<[string, string]> => {
    const viewContainerRef: ViewContainerRef = this._tabPanelHost.viewContainerRef;

    const componentRef: ComponentRef<TabPanelComponent<any>> = viewContainerRef.createComponent<TabPanelComponent<any>>(tabPanel.component);
    componentRef.instance.setData(tabPanel.data);
    this._componentRefs.set(tabPanel.key, componentRef);
    this.setActiveTab(componentRef);

    return componentRef.instance.titles$;
  };

  private switchToTab = (key: string): void => {
    const componentRef: ComponentRef<TabPanelComponent<any>> | undefined = this._componentRefs.get(key);

    if (componentRef) {
      this.setActiveTab(componentRef);
    }
  };

  private closeTab = (key: string): void => {
    const componentRef: ComponentRef<TabPanelComponent<any>> | undefined = this._componentRefs.get(key);

    if (componentRef) {
      const viewRef: ViewRef = componentRef.hostView;
      const viewContainerRef: ViewContainerRef = this._tabPanelHost.viewContainerRef;
      const index: number = viewContainerRef.indexOf(viewRef);

      if (index >= 0) {
        viewContainerRef.remove(index);
      }
      this._componentRefs.delete(key);
    }
  };

  private sendCommand = (key: string, menuCommand: MenuCommand, ...args: any[]): void => {
    const componentRef: ComponentRef<TabPanelComponent<any>> | undefined = this._componentRefs.get(key);

    if (componentRef) {
      componentRef.instance.onCommand(menuCommand, ...args);
    }
  };

  private setActiveTab(componentRef: ComponentRef<TabPanelComponent<any>>): void {
    const viewContainerRef: ViewContainerRef = this._tabPanelHost.viewContainerRef;

    /* First, set each tab panel to 'inactive' (so they won't respond to state changes, etc).  This
      avoids the possibility of two panels both being flagged as 'active' at the same time.
    */
    for (const [, ref] of this._componentRefs) {
      ref.instance.active = false;
    }

    /* Then, make sure the tab to be activated is attached so we don't get any FOIC.
      FYI, if the tab has just been opened, it will already be in ViewContainerRef,
      so insert() appears to just move it.
    */
    viewContainerRef.insert(componentRef.hostView, 0);

    /* Now we can detach all the others (though there should only be one other) */
    for (let i: number = viewContainerRef.length - 1; i > 0; i--) {
      viewContainerRef.detach(i);
    }

    /* And finally, set the active tab panel as 'active' */
    componentRef.instance.active = true;
  }
}
