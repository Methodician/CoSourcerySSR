import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'reverseArray',
  // pure: false // MAKE SURE YOU REALLY WANT IT PURE - this can be expensive.
})
export class ReverseArrayPipe implements PipeTransform {
  transform(value: Array<any>, args?: any): Array<any> {
    if (value) {
      return [...value].reverse();
    }
  }
}
