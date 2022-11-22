// This file is required by karma.conf.js and loads recursively all the .spec and framework files
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

interface Context {
  keys(): string[];
  <T>(id: string): T;
}

interface Requirement {
  context(path: string, deep?: boolean, filter?: RegExp): Context;
}

declare const require: Requirement;

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(BrowserDynamicTestingModule,
                                 platformBrowserDynamicTesting(),
                                 {
                                  teardown: { destroyAfterEach: false }
                                 });
// Then we find all the tests.
const context: Context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);
