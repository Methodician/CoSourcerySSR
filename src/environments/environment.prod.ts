export const environment = {
  production: true,
  // shouldUseEmulator: location.hostname === 'localhost', // does not work in production build
  shouldUseEmulator: false,
  firebase: {
    apiKey: 'AIzaSyD-0e29imJ2TI3N0Wen2njZdBESwOxI6kM',
    authDomain: 'cosourcery.firebaseapp.com',
    databaseURL: 'https://cosourcery.firebaseio.com',
    // databaseURL:
    //   location.hostname === 'localhost'
    //     ? 'http://localhost:9000/?ns=cosourcerytest'
    //     : 'https://cosourcery.firebaseio.com',
    // // does not work in production build
    projectId: 'cosourcery',
    storageBucket: 'cosourcery.appspot.com',
    messagingSenderId: '141292210727',
    appId: '1:141292210727:web:56e5572ac2307685',
    //DEV
    // apiKey: 'AIzaSyAb3L-t-WB0rf6A9j8gVSRB9STJJvLUEfw',
    // authDomain: 'cosourcerytest.firebaseapp.com',
    // databaseURL: 'https://cosourcerytest.firebaseio.com',
    // projectId: 'cosourcerytest',
    // storageBucket: 'cosourcerytest.appspot.com',
    // messagingSenderId: '146479623747',
    // appId: '1:146479623747:web:048a48804bbfcc9b',
  },
};
