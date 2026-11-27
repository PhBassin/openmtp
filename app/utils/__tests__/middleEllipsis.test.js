import {
  MIDDLE_ELLIPSIS,
  extensionLength,
  middleEllipsis,
  splitGraphemes,
} from '../middleEllipsis';

// Monospace-like measure: every grapheme is 10px wide (the ellipsis too).
const CHAR_WIDTH = 10;
const measure = (str) => splitGraphemes(str).length * CHAR_WIDTH;

const fitsIn = (str, maxWidth) => measure(str) <= maxWidth;

describe('splitGraphemes', () => {
  it('keeps decomposed accents and emoji sequences together', () => {
    const nfd = 'été'; // "été" in NFD (macOS file names)

    expect(splitGraphemes(nfd)).toEqual(['é', 't', 'é']);
    expect(splitGraphemes('a👨‍👩‍👧b')).toEqual(['a', '👨‍👩‍👧', 'b']);
  });
});

describe('extensionLength', () => {
  it('detects a regular extension, dot included', () => {
    expect(extensionLength(splitGraphemes('photo.jpeg'))).toBe(5);
    expect(extensionLength(splitGraphemes('archive.tar.gz'))).toBe(3);
  });

  it('ignores dot files, missing and overly long extensions', () => {
    expect(extensionLength(splitGraphemes('.bashrc'))).toBe(0);
    expect(extensionLength(splitGraphemes('README'))).toBe(0);
    expect(extensionLength(splitGraphemes('trailing.'))).toBe(0);
    expect(extensionLength(splitGraphemes('a.averyveryverylongsuffix'))).toBe(
      0
    );
  });
});

describe('middleEllipsis', () => {
  it('returns short names untouched', () => {
    expect(middleEllipsis('notes.txt', 200, measure)).toEqual({
      text: 'notes.txt',
      truncatedText: 'notes.txt',
      isTruncated: false,
    });
  });

  it('returns names fitting exactly untouched', () => {
    const name = 'abcdefghij'; // 100px

    expect(middleEllipsis(name, 100, measure)).toEqual({
      text: name,
      truncatedText: name,
      isTruncated: false,
    });
  });

  it('truncates one pixel below the exact width', () => {
    const result = middleEllipsis('abcdefghij', 99, measure);

    expect(result.isTruncated).toBe(true);
    expect(result.text).toBe('abcdefghij');
    expect(fitsIn(result.truncatedText, 99)).toBe(true);
    expect(result.truncatedText).toBe(`abcd${MIDDLE_ELLIPSIS}ghij`);
  });

  it('keeps the start and the extension of very long names', () => {
    const name = `${'Very long holiday pictures from the summer '.repeat(
      5
    )}final version.jpeg`;
    const result = middleEllipsis(name, 200, measure);

    expect(result.isTruncated).toBe(true);
    expect(fitsIn(result.truncatedText, 200)).toBe(true);
    // uses all the available room: 20 graphemes of 10px
    expect(measure(result.truncatedText)).toBe(200);
    expect(result.truncatedText.startsWith('Very long')).toBe(true);
    expect(result.truncatedText.endsWith('.jpeg')).toBe(true);
    expect(result.truncatedText).toContain(MIDDLE_ELLIPSIS);
  });

  it('keeps the extension even when the room is short', () => {
    const result = middleEllipsis('a_really_long_file_name.jpeg', 80, measure);

    expect(result.truncatedText).toBe(`a_${MIDDLE_ELLIPSIS}.jpeg`);
    expect(fitsIn(result.truncatedText, 80)).toBe(true);
  });

  it('keeps the whole extension with a single leading grapheme', () => {
    const result = middleEllipsis('a_really_long_file_name.jpeg', 70, measure);

    expect(result.truncatedText).toBe(`a${MIDDLE_ELLIPSIS}.jpeg`);
  });

  it('splits evenly when the whole extension does not fit', () => {
    const result = middleEllipsis('a_really_long_file_name.jpeg', 40, measure);

    // the start of the name, not a meaningless "…peg"
    expect(result.truncatedText).toBe(`a_${MIDDLE_ELLIPSIS}g`);
    expect(fitsIn(result.truncatedText, 40)).toBe(true);
  });

  it('splits evenly names without extension', () => {
    const result = middleEllipsis('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 90, measure);

    expect(result.truncatedText).toBe(`ABCD${MIDDLE_ELLIPSIS}WXYZ`);
  });

  it('never breaks accents, emojis or surrogate pairs', () => {
    const name = `Déjà vu été 2024 😀😀😀 vidéo.mp4`;
    const result = middleEllipsis(name, 120, measure);
    const graphemes = splitGraphemes(name);
    const kept = splitGraphemes(result.truncatedText).filter(
      (g) => g !== MIDDLE_ELLIPSIS
    );

    expect(result.isTruncated).toBe(true);
    expect(fitsIn(result.truncatedText, 120)).toBe(true);
    // every kept grapheme exists unaltered in the original name
    kept.forEach((g) => expect(graphemes).toContain(g));
    expect(result.truncatedText.endsWith('.mp4')).toBe(true);
    expect(result.truncatedText.startsWith('Dé')).toBe(true);
  });

  it('handles a precomposed unicode name with a real-like measure', () => {
    const name = 'Présentation_réunion_équipe_février_à_Montréal.pptx';
    const proportional = (str) =>
      splitGraphemes(str).reduce(
        (acc, g) => acc + (/[A-Z]/.test(g) ? 9 : 6),
        0
      );
    const result = middleEllipsis(name, 150, proportional);

    expect(result.isTruncated).toBe(true);
    expect(proportional(result.truncatedText)).toBeLessThanOrEqual(150);
    expect(result.truncatedText.endsWith('.pptx')).toBe(true);
    expect(result.truncatedText.startsWith('Pré')).toBe(true);
  });

  it('returns only the ellipsis for a tiny width', () => {
    const result = middleEllipsis('some_file.txt', 5, measure);

    expect(result).toEqual({
      text: 'some_file.txt',
      truncatedText: MIDDLE_ELLIPSIS,
      isTruncated: true,
    });
  });

  it('returns only the ellipsis for a zero width', () => {
    expect(middleEllipsis('some_file.txt', 0, measure).truncatedText).toBe(
      MIDDLE_ELLIPSIS
    );
  });

  it('does not truncate while the width is unknown', () => {
    [undefined, null, NaN, Infinity].forEach((width) => {
      expect(middleEllipsis('a_long_file_name.txt', width, measure)).toEqual({
        text: 'a_long_file_name.txt',
        truncatedText: 'a_long_file_name.txt',
        isTruncated: false,
      });
    });
  });

  it('handles empty and non string input', () => {
    expect(middleEllipsis('', 10, measure).truncatedText).toBe('');
    expect(middleEllipsis(undefined, 10, measure).truncatedText).toBe('');
    expect(middleEllipsis(12345, 1000, measure).truncatedText).toBe('12345');
  });

  it('accepts a custom ellipsis', () => {
    const result = middleEllipsis('abcdefghijklmnop', 100, measure, '...');

    expect(result.truncatedText).toBe('abcd...nop');
    expect(fitsIn(result.truncatedText, 100)).toBe(true);
  });

  it('always fits the given width', () => {
    const name = 'IMG_20240615_183045_HDR_panorama_final_v2.heic';

    for (let width = 10; width <= measure(name); width += 7) {
      const result = middleEllipsis(name, width, measure);

      expect(fitsIn(result.truncatedText, width)).toBe(true);
      // and it is the longest possible result
      expect(measure(result.truncatedText) + CHAR_WIDTH > width).toBe(true);
    }
  });
});
