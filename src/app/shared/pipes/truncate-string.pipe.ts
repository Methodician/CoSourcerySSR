import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncateString',
})
export class TruncateStringPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    const max = args ? args : 30;

    if (!value) {
      return;
    }

    if (value.length > max) {
      return `${value.substr(0, max)}...`;
    }
    return value;
  }
}
