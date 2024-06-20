import { Component } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  UntypedFormBuilder,
  UntypedFormControl,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  public form!: FormGroup;
  public firstAttemptWordControl: UntypedFormControl = new FormControl('');
  public firstAttemptMatchesControl: UntypedFormControl = new FormControl(null);
  public secondAttemptWordControl: UntypedFormControl = new FormControl('');
  public secondAttemptMatchesControl: UntypedFormControl = new FormControl(null);
  public thirdAttemptWordControl: UntypedFormControl = new FormControl('');
  public thirdAttemptMatchesControl: UntypedFormControl = new FormControl(null);
  public initialGuesses: string[] = [];
  public firstAttemptGuesses: string[] = [];
  public secondAttemptGuesses: string[] = [];
  public thirdAttemptGuesses: string[] = [];
  public maxMatches: number = 0;
  public initialMatchesMap: {[key: string]: number} = {};

  public constructor(
    private _fb: UntypedFormBuilder,
  ) {
    this.form = this._fb.group({
      first: ['', Validators.required],
      second: ['', Validators.required],
      third: ['', Validators.required],
      forth: ['', Validators.required],
      fifth: ['', Validators.required],
      sixth: ['', Validators.required],
      seventh: ['', Validators.required],
    });

    this.form.controls['first'].addValidators(this._wordLengthValidator('first'));
    this.form.controls['second'].addValidators(this._wordLengthValidator('second'));
    this.form.controls['third'].addValidators(this._wordLengthValidator('third'));
    this.form.controls['forth'].addValidators(this._wordLengthValidator('forth'));
    this.form.controls['fifth'].addValidators(this._wordLengthValidator('fifth'));
    this.form.controls['sixth'].addValidators(this._wordLengthValidator('sixth'));
    this.form.controls['seventh'].addValidators(this._wordLengthValidator('seventh'));

    this.form.valueChanges
      .subscribe(() => {
        if (this.initialGuesses.length) {
          this._resetAttemptsForms();
        }
      });

    combineLatest(
      this.firstAttemptWordControl.valueChanges,
      this.firstAttemptMatchesControl.valueChanges,
    ).subscribe(([baseWord, matches]: [string, number]) => {
      if (this.initialMatchesMap[baseWord] && matches !== null) {
        let words: string[] = Object.values(this.form.value);
        this.firstAttemptGuesses = words
          .filter((word: string) => baseWord !== word)
          .filter((word: string) => {
            return word.split('')
              .filter((letter: string, index: number) => letter === baseWord[index])
              .length === matches;
          });

        return;
      }

      this.firstAttemptGuesses = [];
    });

    combineLatest(
      this.secondAttemptWordControl.valueChanges,
      this.secondAttemptMatchesControl.valueChanges,
    ).subscribe(([baseWord, matches]: [string, number]) => {
      if (this.initialMatchesMap[baseWord] && matches !== null) {
        this.secondAttemptGuesses = this.firstAttemptGuesses
          .filter((word: string) => baseWord !== word)
          .filter((word: string) => {
            return word.split('')
              .filter((letter: string, index: number) => letter === baseWord[index])
              .length === matches;
          });

        return;
      }

      this.secondAttemptGuesses = [];
    });

    combineLatest(
      this.thirdAttemptWordControl.valueChanges,
      this.thirdAttemptMatchesControl.valueChanges,
    ).subscribe(([baseWord, matches]: [string, number]) => {
      if (this.initialMatchesMap[baseWord] && matches !== null) {
        this.thirdAttemptGuesses = this.secondAttemptGuesses
          .filter((word: string) => baseWord !== word)
          .filter((word: string) => {
            return word.split('')
              .filter((letter: string, index: number) => letter === baseWord[index])
              .length === matches;
          });

        return;
      }

      this.thirdAttemptGuesses = [];
    });
  }

  public countMaxMatches(): void {
    this.initialMatchesMap = {};

    const words: string[] = Object.values(this.form.value);

    words.forEach((baseWord: string) => {
      if (baseWord) {
        this.initialMatchesMap[baseWord] = words.reduce((matches: number, word: string) => {
          const currentMatches: number = !word ? 0 : word.split('').reduce((matchesCount: number, char: string, index: number) => {
              return baseWord[index] === char ? matchesCount + 1 : matchesCount
            }, 0)
          ;

          return word === baseWord ? matches : matches + currentMatches;
        }, 0);
      }
    })

    this.maxMatches = Math.max(...Object.values(this.initialMatchesMap));

    this.initialGuesses = Object.keys(this.initialMatchesMap).filter(
      (word: string) => this.initialMatchesMap[word] === this.maxMatches
    )
  }

  public selectInitialGuess(word: string): void {
    this.firstAttemptWordControl.setValue(word);
  }

  public selectSecondGuess(word: string): void {
    this.secondAttemptWordControl.setValue(word);
  }

  public selectThirdGuess(word: string): void {
    this.thirdAttemptWordControl.setValue(word);
  }

  public clear(): void {
    this.form.reset();
    this._resetAttemptsForms();
    this.initialGuesses = [];
    this.maxMatches = 0;
    this.initialMatchesMap = {};
  }

  private _resetAttemptsForms(): void {
    this.firstAttemptWordControl.reset('');
    this.firstAttemptMatchesControl.reset(null);
    this.secondAttemptWordControl.reset('');
    this.secondAttemptMatchesControl.reset(null);
    this.thirdAttemptWordControl.reset('');
    this.thirdAttemptMatchesControl.reset(null);

    this.initialGuesses = [];
    this.maxMatches = 0;
    this.initialMatchesMap = {};
    this.firstAttemptGuesses = [];
    this.secondAttemptGuesses = [];
    this.thirdAttemptGuesses = [];
  }

  private _wordLengthValidator(controlName: string): ValidatorFn {
    return (currentControl: AbstractControl): ValidationErrors | null => {
      if (!currentControl) {
        return null;
      }

      const formValue: {[key: string]: string} = {...this.form.value};
      delete formValue[controlName];

      return Object.values(formValue)
        .some((word: string) => currentControl.value && word && word.length !== currentControl.value.length) ? { length: true } : null;
    };
  }
}
