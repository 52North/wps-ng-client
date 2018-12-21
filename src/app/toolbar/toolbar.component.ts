import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {
    
  selected : string = "option1";
  translationService : TranslateService;

    constructor(translate: TranslateService) { 
        translate.setDefaultLang(environment.startLanguage);
        this.translationService = translate;
    }

    ngOnInit() {
        if (environment.startLanguage) {
            switch(environment.startLanguage){
                case "de":
                    this.selected = "option2";
                    this.translationService.use('de');
                    console.log("german loaded");
                    break;
                case "en":
                    console.log("english loaded");
                default:
                    this.selected = "option1";
                    this.translationService.use('en');
                    console.log("english loaded");
                    break;
            }
        } else {
            this.selected = "option1";
            this.translationService.use('en');
            console.log("english loaded");
        }
    }
    
    languageChange(event) {
        switch (event.value) {
            case "option2":
                this.translationService.use('de');
                console.log("german loaded");
                break;
            case "option1":
            case "none":
                this.translationService.use('en');
                console.log("english loaded");
                break;
        }
    }

}
