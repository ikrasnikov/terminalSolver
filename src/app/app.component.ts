import { Component, ElementRef, ViewChild } from '@angular/core';
import {
  AbstractControl, AbstractControlOptions, FormArray,
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
  private readonly _DEFAULT_WORD_QUANTITY: number = 8;

  @ViewChild('backButton') public backButton!: ElementRef;
  @ViewChild('clearButton') public clearButton!: ElementRef;

  public wordsQuantity: UntypedFormControl = new FormControl(
    this._DEFAULT_WORD_QUANTITY,
    [Validators.required, Validators.min(2), Validators.max(20)]
  );
  public form!: FormArray;
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
    this.form = this._getForm(this.wordsQuantity.value)

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
      if (this._shouldCountGuesses(baseWord, matches)) {
        this.firstAttemptGuesses = this._getAttemptGuess((Object.values(this.form.value) as string[]), baseWord, matches);
        this._scrollToElement(this.backButton);

        return;
      }

      this.firstAttemptGuesses = [];
    });

    combineLatest(
      this.secondAttemptWordControl.valueChanges,
      this.secondAttemptMatchesControl.valueChanges,
    ).subscribe(([baseWord, matches]: [string, number]) => {
      if (this._shouldCountGuesses(baseWord, matches)) {
        this.secondAttemptGuesses = this._getAttemptGuess(this.firstAttemptGuesses, baseWord, matches);
        this._scrollToElement(this.backButton);

        return;
      }

      this.secondAttemptGuesses = [];
    });

    combineLatest(
      this.thirdAttemptWordControl.valueChanges,
      this.thirdAttemptMatchesControl.valueChanges,
    ).subscribe(([baseWord, matches]: [string, number]) => {
      if (this._shouldCountGuesses(baseWord, matches)) {
        this.thirdAttemptGuesses = this._getAttemptGuess(this.secondAttemptGuesses, baseWord, matches);
        this._scrollToElement(this.backButton);

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
          const currentMatches: number = !word
            ? 0
            : word.split('').reduce((matchesCount: number, char: string, index: number) => {
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
    this._selectGuess(word, this.firstAttemptWordControl, this.backButton);
  }

  public selectSecondGuess(word: string): void {
    this._selectGuess(word, this.secondAttemptWordControl, this.backButton);
  }

  public selectThirdGuess(word: string): void {
    this._selectGuess(word, this.thirdAttemptWordControl, this.backButton);
  }

  public regenerateForm(wordsQuantity: number, formValue: { [key: string]: string} ): void {
    this.form = this._getForm(wordsQuantity, formValue);
    this._resetAttemptsForms();
  }

  public clear(): void {
    this.form.reset();
    this._resetAttemptsForms();
  }

  public back(): void {
    this._scrollToElement(this.clearButton);
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
      if (!currentControl || !this.form) {
        return null;
      }

      const formValue: {[key: string]: string} = {...this.form.value};
      delete formValue[controlName];

      return Object.values(formValue)
        .some((word: string) => currentControl.value && word && word.length !== currentControl.value.length) ? { length: true } : null;
    };
  }

  private _getForm(controlsLength: number, initialValue?: { [key: string]: string }): FormArray {
    return this._fb.array(
      [...Array(controlsLength).keys()].map(
        (index: number) => new FormControl((initialValue && initialValue[`${index}`]) || '', [Validators.required, this._wordLengthValidator(`${index}`)])
      )
    );
  }

  private _getAttemptGuess(previousGuesses: string[], baseWord: string, matches: number): string[] {
    return previousGuesses
      .filter((word: string) => baseWord !== word)
      .filter((word: string) => {
        return word.split('')
          .filter((letter: string, index: number) => letter === baseWord[index])
          .length === matches;
      });
  }

  private _shouldCountGuesses(baseWord: string, matches: number): boolean {
    return this.initialMatchesMap[baseWord] !== undefined && matches !== null;
  }

  private _selectGuess(word: string, control: UntypedFormControl, controlElementRef: ElementRef): void {
    control.setValue(word);
    this._scrollToElement(controlElementRef);
  }

  private _scrollToElement(elementRef: ElementRef): void {
    elementRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
}
