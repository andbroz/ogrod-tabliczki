import { existsSync, readFileSync } from 'node:fs';

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

interface AssetGroup {
  name: string;
  installMode: string;
  resources: { files?: string[] };
}

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8')) as {
  name: string;
  short_name: string;
  lang: string;
  display: string;
  start_url: string;
  scope: string;
  theme_color: string;
  background_color: string;
  icons: ManifestIcon[];
};
const ngsw = JSON.parse(readFileSync('ngsw-config.json', 'utf8')) as {
  assetGroups: AssetGroup[];
};

describe('PWA manifest', () => {
  it('is in Polish with the game name', () => {
    expect(manifest.lang).toBe('pl');
    expect(manifest.name).toBe('Ogród Tabliczki');
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
  });

  it('opens as a standalone app in the game colours', () => {
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color.toLowerCase()).toBe('#1d6b34');
    expect(manifest.background_color.toLowerCase()).toBe('#fdf8ec');
  });

  it('uses relative URLs so it works under the GitHub Pages sub-path', () => {
    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');
    for (const icon of manifest.icons) expect(icon.src).not.toMatch(/^\//);
  });

  it('has existing 192 and 512 px PNG icons, plus a maskable one', () => {
    const png = (size: string) =>
      manifest.icons.filter((i) => i.sizes === size && i.type === 'image/png');
    expect(png('192x192').length).toBeGreaterThan(0);
    expect(png('512x512').length).toBeGreaterThan(0);
    expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) expect(existsSync(`public/${icon.src}`)).toBe(true);
  });
});

describe('service worker config', () => {
  it('prefetches the app shell and the bundled plant art, so the first offline game has it', () => {
    const prefetched = ngsw.assetGroups
      .filter((g) => g.installMode === 'prefetch')
      .flatMap((g) => g.resources.files ?? []);
    expect(prefetched).toEqual(expect.arrayContaining(['/index.html', '/*.js', '/*.css']));
    expect(prefetched).toContain('/media/**');
  });
});
