import { AbstractControl, UntypedFormControl } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'asFormControl',
})
export class AsFormControlPipe implements PipeTransform {
  public transform(value: AbstractControl): UntypedFormControl {
    return value as UntypedFormControl;
  }
}
