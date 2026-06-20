import type { BlogPost } from './blog-data'

export function generateBlogPostStructuredData(post: BlogPost, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: `${url}/og-images/${post.slug}.png`,
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: 'https://github.com/MoshRadix',
    },
    publisher: {
      '@type': 'Person',
      name: 'Mohamed Shamil',
      url: 'https://moshradix.dev',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${url}/blog/${post.slug}`,
    },
    articleSection: post.category,
    keywords: post.tags.join(', '),
    timeRequired: post.readTime,
  }
}

export function generateWebsiteStructuredData(url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MOSHRADIX',
    description: "A digital workshop where ideas get built, broken, and rebuilt. Open-source tools, home-automation experiments, and field notes from the Maldives, by Mohamed Shamil.",
    url: url,
    author: {
      '@type': 'Person',
      name: 'Mohamed Shamil',
      url: 'https://github.com/MoshRadix',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/blog?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generatePersonStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Mohamed Shamil',
    url: 'https://moshradix.dev',
    image: 'https://moshradix.dev/developer-portrait.png',
    sameAs: [
      'https://github.com/MoshRadix',
      'https://twitter.com/MoshRadix',
      'http://www.mosh-one.us/',
    ],
    jobTitle: 'IT Administrator & Hobbyist Developer',
    worksFor: {
      '@type': 'Organization',
      name: 'MOSHRADIX',
    },
  }
}

export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
