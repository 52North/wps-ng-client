import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HttpGetService } from '../services/http-get.service';
import { AppSettings } from '../model/app-setting';

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

    selected = 'option1';
    translationService: TranslateService;

    constructor(translate: TranslateService, private httpGetService: HttpGetService) {
        translate.setDefaultLang('en');
        this.translationService = translate;
    }

    ngOnInit() {
        this.httpGetService.getAppSettings()
            .subscribe((settings: AppSettings) => {
                console.log(settings);
                // MAP SETTINGS:
                if (settings.startLanguage) {
                    switch (settings.startLanguage) {
                        case 'de':
                            this.selected = 'option2';
                            this.translationService.use('de');
                            console.log('german loaded');
                            break;
                        case 'en':
                            console.log('english loaded');
                            break;
                        default:
                            this.selected = 'option1';
                            this.translationService.use('en');
                            console.log('english loaded');
                            break;
                    }
                } else {
                    this.selected = 'option1';
                    this.translationService.use('en');
                    console.log('english loaded');
                }
            });
    }

    languageChange(event) {
        switch (event.value) {
            case 'option2':
                this.translationService.use('de');
                console.log('german loaded');
                break;
            case 'option1':
            case 'none':
                this.translationService.use('en');
                console.log('english loaded');
                break;
        }
    }

}
