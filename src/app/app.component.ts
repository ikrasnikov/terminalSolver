import { Component } from '@angular/core';
import { FormControl, FormGroup, UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
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
      first: 'tall',
      second: 'tell',
      third: 'sail',
      forth: 'call',
      fifth: 'back',
      sixth: 'lock',
      seventh: 'form',
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
    const words: string[] = Object.values(this.form.value);

    words.forEach((baseWord: string) => {
      this.initialMatchesMap[baseWord] = words.reduce((matches: number, word: string) => {
        const currentMatches: number = word.split('').reduce((matchesCount: number, char: string, index: number) => {
          return baseWord[index] === char ? matchesCount + 1 : matchesCount
        }, 0);

        return word === baseWord ? matches : matches + currentMatches;
      }, 0);
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
}
