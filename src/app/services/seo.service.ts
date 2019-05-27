import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  constructor(private meta: Meta, private title: Title) {}

  generateTags = (tags?: SEOtags) => {
    /**default values */
    tags = {
      title: 'CoSourcery - Discover neat stuff!',
      description:
        'CoSourcewry is empowering the makers and hackers of the world to discover and share actionable information',
      imageUrl: 'http://cosourcery.com/assets/images/logo.svg',
      ...tags,
    };

    this.title.setTitle(tags.title);

    this.meta.updateTag({ name: 'description', content: tags.description });
    this.meta.updateTag({ name: 'image', content: tags.imageUrl });

    // // Twitter
    // this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    // this.meta.updateTag({ name: 'twitter:site', content: '@angularfirebase' });
    // this.meta.updateTag({ name: 'twitter:title', content: tags.title });
    // this.meta.updateTag({
    //   name: 'twitter:description',
    //   content: tags.description,
    // });
    // this.meta.updateTag({ name: 'twitter:image', content: tags.imageUrl });

    // OG (Facebook)
    // this.meta.updateTag({ property: 'og:type', content: 'article' });
    // this.meta.updateTag({
    //   property: 'og:site_name',
    //   content: 'AngularFirebase',
    // });
    // this.meta.updateTag({ property: 'og:title', content: tags.title });
    // this.meta.updateTag({
    //   property: 'og:description',
    //   content: tags.description,
    // });
    // this.meta.updateTag({ property: 'og:image', content: tags.image });
    // this.meta.updateTag({
    //   property: 'og:url',
    //   content: `https://yourapp.com/${tags.slug}`,
    // });
  };
}

export interface SEOtags {
  title: string;
  description: string;
  imageUrl?: string;
  slug?: string;
  tags?: string[];
}
