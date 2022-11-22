/* eslint-disable @typescript-eslint/no-magic-numbers */

import { TestBed, waitForAsync } from '@angular/core/testing';

import { removeFromArray } from './array';

const FIRST: string = 'first';
const SECOND: string = 'second';
const THIRD: string = 'third';
const FOURTH: string = 'fourth';

describe('utility/array', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
            })
          .compileComponents();
  }));

  describe('removeFromArray', () => {
    it('should remove item if found', waitForAsync(() => {
      const array: string[] = [
        FIRST,
        SECOND,
        THIRD,
        FOURTH
      ];

      let item: string = array[0];
      let index: number = removeFromArray<string>(array, item);
      expect(index).toBe(0);
      expect(array).toEqual([SECOND, THIRD, FOURTH]);
      index = removeFromArray<string>(array, item);
      expect(index).toBe(-1);
      expect(array.length).toBe(3);

      item = array[2];
      index = removeFromArray<string>(array, item);
      expect(index).toBe(2);
      expect(array).toEqual([SECOND, THIRD]);
      index = removeFromArray<string>(array, item);
      expect(index).toBe(-1);
      expect(array.length).toBe(2);
    }));
  });
});
