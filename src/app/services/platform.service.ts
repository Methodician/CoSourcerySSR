import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { REQUEST } from '@nguniversal/express-engine/tokens';

@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  isServer: boolean;
  isBrowser: boolean;

  host: string;
  protocol: string;
  baseUrl: string;

  constructor(
    @Optional() @Inject(REQUEST) request: any,
    @Inject(PLATFORM_ID) platformId: string,
  ) {
    this.isServer = isPlatformServer(platformId);
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isServer) {
      this.protocol = request.protocol;
      this.host = request.get('host');
      this.baseUrl = `${this.protocol}://${this.host}`;
    } else {
      this.protocol = window.location.protocol;
      this.host = window.location.host;
      this.baseUrl = `${this.protocol}//${this.host}`;
    }
  }
}
