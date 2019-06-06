import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, flatMap } from "rxjs/operators"
import { Entry } from './entry.model';
import { CategoryService } from '../../categories/shared/category.service';

@Injectable({
  providedIn: 'root'
})
export class EntryService {

  private apiPath: string = "api/entries";

  constructor(
    private http: HttpClient,
    private categoryService: CategoryService
  ) { }

  getAll(): Observable<Entry[]> {
    return this.http.get(this.apiPath).pipe(
      catchError(this.handlerError),
      map(this.jsonDataToEntries)
    )
  }

  getById(id: number): Observable<Entry> {
    const url = `${this.apiPath}/${id}`;

    return this.http.get(url).pipe(
      catchError(this.handlerError),
      map(this.jsonDataToEntry)
    )
  }

  create(entry: Entry): Observable<Entry> {

    return this.categoryService.getById(entry.categoryId).pipe(
      flatMap(category => {
        entry.category = category;

        return this.http.post(this.apiPath, entry).pipe(
          catchError(this.handlerError),
          map(this.jsonDataToEntry)
        )
      })
    )

  }

  update(entry: Entry): Observable<Entry> {

    return this.categoryService.getById(entry.categoryId).pipe(
      flatMap(category => {
        entry.category = category;

        return this.http.put(this.apiPath, entry).pipe(
          catchError(this.handlerError),
          map(() => entry)
        )
      })
    ) 
   
  }

  delete(id: number): Observable<any> {
    const url = `${this.apiPath}/${id}`;

    return this.http.delete(url).pipe(
      catchError(this.handlerError),
      map(() => null)
    )
  }

  //PRIVATE METHODS
  private jsonDataToEntries(jsonData: any[]): Entry[] {
    // console.log(jsonData[0] as Entry);
    // console.log(Object.assign(new Entry(), jsonData[0] ));    

    const entries: Entry[] = []
    // jsonData.forEach(element => entries.push(element as Entry)) //DESTA FORMA NAO RETORNA UM OBJ ENTRY
    jsonData.forEach(element => {
      // const entry = new Entry()
      // Object.assign(entry, element)
      //deixando mais limpo
      const entry = Object.assign(new Entry(), element);
      entries.push(entry);
    })
    return entries
  }

  private jsonDataToEntry(jsonData: any): Entry {
    return Object.assign(new Entry(), jsonData);
  }

  private handlerError(error: any): Observable<any> {
    console.log('ERROR NA REQUISIÇÃO =>, ', error);
    return throwError(error)
  }
}
