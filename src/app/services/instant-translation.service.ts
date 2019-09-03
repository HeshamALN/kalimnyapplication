import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment.prod';
import {TranslationModel} from '../models/translation.model';

@Injectable({
  providedIn: 'root'
})
export class InstantTranslationService {

  constructor(
    private http: HttpClient,
  ) { }

  // using https://rapidapi.com/systran/api/systran-io-translation-and-nlp
  arToEn(text: string): Observable<TranslationModel> {
    return this.http.get<TranslationModel>('https://systran-systran-platform-for-language-processing-v1.p.rapidapi.com/translation/text/translate?source=' +
        'ar' +
        '&target=' +
        'en' +
        '&input=' +
        text, {
          headers: new HttpHeaders({
            'X-RapidAPI-Key': environment.X_RapidAPI_Key
          })
        }
      ).pipe(
          catchError(this.handleError)
    );
  }

  arToDe(text: string): Observable<TranslationModel> {
    return this.http.get<TranslationModel>('https://systran-systran-platform-for-language-processing-v1.p.rapidapi.com/translation/text/translate?source=' +
        'ar' +
        '&target=' +
        'de' +
        '&input=' +
        text, {
          headers: new HttpHeaders({
            'X-RapidAPI-Key': environment.X_RapidAPI_Key
          })
        }
      ).pipe(
          catchError(this.handleError)
    );
  }

  enToAr(text: string): Observable<TranslationModel> {
      console.log(text);
    return this.http.get<TranslationModel>('https://systran-systran-platform-for-language-processing-v1.p.rapidapi.com/translation/text/translate?source=' +
        'en' +
        '&target=' +
        'ar' +
        '&input=' +
        text, {
          headers: new HttpHeaders({
            'X-RapidAPI-Key': environment.X_RapidAPI_Key
          })
        }
    ).pipe(
        catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred: ', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
          `Backend returned code ${error.status}, ` +
          `body was: ${error}`);
    }
    // return an observable with a user-facing error message
    return throwError(
        'Something bad happened; please try again later.');
  }

}
