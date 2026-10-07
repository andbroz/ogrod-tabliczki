import { readFileSync, statSync } from 'node:fs';

const PLANTS = ['seed', 'sprout', 'flower', 'soil-covered'];
const path = (name: string) => `src/plants/${name}.svg`;

describe('garden art', () => {
  it.each(PLANTS)('%s.svg is at most 4 kB', (name) => {
    expect(statSync(path(name)).size).toBeLessThanOrEqual(4096);
  });

  it.each(PLANTS)(
    '%s.svg is self-contained (no external references, scripts or images)',
    (name) => {
      const svg = readFileSync(path(name), 'utf8');
      expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      const withoutNamespace = svg.replace('xmlns="http://www.w3.org/2000/svg"', '');
      expect(withoutNamespace).not.toMatch(/https?:|href=|<script|<image|<foreignObject/i);
    },
  );

  it.each(PLANTS)('%s.svg has a viewBox so it scales to any cell size', (name) => {
    expect(readFileSync(path(name), 'utf8')).toMatch(/viewBox="0 0 32 32"/);
  });
});
