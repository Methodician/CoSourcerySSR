import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

import { statsIconMap } from '@shared_models/article.models';
import { PlatformService } from '@services/platform.service';

@Component({
  selector: 'cos-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'cosourcery';

  constructor(
    platformSvc: PlatformService,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
  ) {
    const { baseUrl } = platformSvc;
    Object.entries(statsIconMap).map(([name, path]) => {
      iconRegistry.addSvgIcon(
        name,
        sanitizer.bypassSecurityTrustResourceUrl(`${baseUrl}/${path}`),
      );
    });
  }
}
