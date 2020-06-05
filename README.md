
# WpsNgClient

Web Processing Services client using wps-js, angular 7, angular-materials 2 and flexbox. This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.2.1.


## Description 

### Modern Web Application for Geoprocessing

**Providing an extensible lightweight single page application for web browsers**

A map centred design forms the foundation of this software component. The aim is to provide a lightweight single page application for modern web browsers. The application is written on top of the Angular framework and its UI counterpart Angular Material. This makes it easily extensible due to its component-based architecture.

Under the hood, the application uses the 52°North wps-js library, which is responsible for the interaction with the WPS backend. A clear separation of concern is guaranteed and the application can focus on the UI/UX aspects and the visualization of input and output data. The wizard-style execution of WPS processes guides the user through all relevant steps and provides convenient functions (e.g. auto-fill parameters withdefault values) that creates an intuitive user experience.

The wps-ng-client architecture catalyzes the creation of individual web applications for specific use cases or scenarios. As a central UI element, the map enables developers to easily create context and associate the user with a scenario’s relevant information and explain how to use the process.

Recent developments focused on increased support of input formats (e.g. different geometry types) as well as the improvement of the process result visualizations. The client has been tested elaborately with different WPS implementations (e.g. 52°North WPS, 52°North javaPS and PyWPS) to ensure its robust function.

**Key Technologies**

- Angular
- Angular Material
- JavaScript
- TypeScript
- OpenLayers
- wps-js

**Benefits**

- Visualization of web processes’ inputs and outputs
- Support for all major browsers due to the Angular framework
- Wizard-style process execution eases the interaction with WPS backends
- Lightweight component architecture makes the software easily extensible


<!-- ## Quick Start

How to install the software, i.e. installation and configuration. If you link to a wiki page for example, please provide a short description and then the link. See conventions below. -->

## Demo

**Live example**

Test the functionalities on the [github.io page](https://52North.github.io/wps-ng-client/).

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).


<!--## Changelog -->


## References 
The software is in operational use in the following projects
- [RIESGOS](https://www.riesgos.de/en/)
- [MuDak-WRM](https://www.mudak-wrm.kit.edu/)
- [OGC Testbed 15](https://www.opengeospatial.org/projects/initiatives/testbed15)
- [CITRAM](https://citram.de/)

