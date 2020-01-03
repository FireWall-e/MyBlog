import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(
    private fireStore: AngularFirestore,
  ) { }

  createReference(path): AngularFirestoreDocument<any> {
    return this.fireStore.doc(path);
  }

  query(path, processingFunction): AngularFirestoreCollection<any> {
    return this.fireStore.collection(path, processingFunction);
  }

  getValue(reference, key = '') {
    return new Promise((resolve, reject) => {
      reference.valueChanges().subscribe(data => {
        console.log('key is ', key, data, data[key])
        console.log('query bool ', key && (data || {})[key]);
        resolve(key && key in (data || {}) ? data[key] : data);
      });
    });
  }
}
