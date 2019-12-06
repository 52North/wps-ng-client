// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // map configuration:
  startCenter: {
//    latitude: 51.9487949,
//    longitude: 7.6237527
    latitude: -33.465921,
    longitude: -70.660072
  },
  startZoom: 9,                    // 1,2,...,18 ; 1-world view, 18-very close
  "scaleBar": {
    "visible": false,
    "settings": {}
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
