import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { isPlatformServer } from '@angular/common';

import { statsIconMap } from '@shared_models/article.models';

@Component({
  selector: 'cos-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'cosourcery';

  constructor(
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) platformId: string,
  ) {
    const urlBase = isPlatformServer(platformId)
      ? `http://localhost:4200/`
      : '';
    Object.entries(statsIconMap).map(([name, path]) => {
      iconRegistry.addSvgIcon(
        name,
        sanitizer.bypassSecurityTrustResourceUrl(`${urlBase}${path}`),
      );
    });
  }
}
