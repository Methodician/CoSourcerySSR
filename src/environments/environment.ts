// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  shouldUseEmulator: location.hostname === 'localhost',
  // shouldUseEmulator: false,
  firebase: {
    apiKey: 'AIzaSyAb3L-t-WB0rf6A9j8gVSRB9STJJvLUEfw',
    authDomain: 'cosourcerytest.firebaseapp.com',
    // databaseURL: 'https://cosourcerytest.firebaseio.com',
    databaseURL:
      location.hostname === 'localhost'
        ? 'http://localhost:9000/?ns=cosourcerytest'
        : 'https://cosourcerytest.firebaseio.com',
    projectId: 'cosourcerytest',
    storageBucket: 'cosourcerytest.appspot.com',
    messagingSenderId: '146479623747',
    appId: '1:146479623747:web:048a48804bbfcc9b',
    // PROD:
    // apiKey: 'AIzaSyD-0e29imJ2TI3N0Wen2njZdBESwOxI6kM',
    // authDomain: 'cosourcery.firebaseapp.com',
    // databaseURL: 'https://cosourcery.firebaseio.com',
    // projectId: 'cosourcery',
    // storageBucket: 'cosourcery.appspot.com',
    // messagingSenderId: '141292210727',
    // appId: '1:141292210727:web:56e5572ac2307685',
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error'; // Included with Angular CLI.
