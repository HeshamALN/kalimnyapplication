import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import { ResultModel } from '../models/result.model';
import { environment } from '../../environments/environment.prod';
import {catchError} from 'rxjs/operators';
import {ImageResultModel} from '../models/imageResult.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor(
      private http: HttpClient,
  ) {}

  textSearchWithGoogle(query: string): Observable<ResultModel> {
    return this.http.get<ResultModel>(`https://www.googleapis.com/customsearch/v1?key=${environment.gAPI_id}&cx=${environment.cx}&q=${query}`,
      {}).pipe(catchError(this.handleError));
  }

  imageSearch(entry: string): Observable<ImageResultModel> {
    const pageNumber = 1;
    const pageSize = 3;
    const autoCorrect = true;
    const safeSearch = true;

    return this.http.get<ImageResultModel>('https://contextualwebsearch-websearch-v1.p.rapidapi.com/api/Search/ImageSearchAPI?autoCorrect=' +
      autoCorrect +
      '&pageNumber=' +
      pageNumber +
      '&pageSize=' +
      pageSize +
      '&q=' +
      entry +
      '&safeSearch=' +
      safeSearch, {
        headers: new HttpHeaders({
          'X-RapidAPI-Key': environment.X_RapidAPI_Key
      })
    }).pipe(catchError(this.handleError));
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
