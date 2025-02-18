function similarity(song1, song2) {
  const NOTE_MAP = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };

  const parseNum = (onmei, i) => {
    let num = NOTE_MAP[onmei.charAt(0)] ?? null;
    if (num === null) return null;

    num += i + (onmei.includes('#') ? 1 : 0) - (onmei.includes('b') ? 1 : 0);
    return num % 12;
  }

  const parseTriad = (chordName) => {
    return chordName.replace(/(add9|M9|\+9|M7|7|69|9|dim)/g, match => (match === 'dim' ? 'm-5' : ''));
  }

  const PATTERN_MAP = {
    'sus2': [0, 2, 7],
    'sus4': [0, 5, 7],
    'aug': [0, 4, 8],
    'm-5': [0, 3, 6],
    '-5': [0, 4, 6],
    'm': [0, 3, 7],
    'default': [0, 4, 7],
  };

  const kouseion = (chord, t) => {
    const chordName = parseTriad(chord);
    let count = Array(12).fill(0);

    if (chordName.includes('/')) {
      // 分数コードの場合
      const [baseChord, root] = chordName.split('/');
      count[parseNum(root, t)] += 1;

      const pattern = Object.keys(PATTERN_MAP).find(key => baseChord.includes(key)) || 'default';
      PATTERN_MAP[pattern].forEach((interval, index) => {
        count[parseNum(baseChord.replace(pattern, ''), t + interval)] += index === 0 ? 2 : 1; // ルート音だけ2カウント
      });
    } else {
      // 分数コード以外の場合
      const pattern = Object.keys(PATTERN_MAP).find(key => chordName.includes(key)) || 'default';
      PATTERN_MAP[pattern].forEach((interval, index) => {
        count[parseNum(chordName.replace(pattern, ''), t + interval)] += index === 0 ? 2 : 1; // ルート音だけ2カウント
      });
    }

    return count;
  }

  const chordSimilarity = (chord1, chord2, t) => {
    const kousei1 = kouseion(chord1, 0);
    const kousei2 = kouseion(chord2, t);
    return 1 - Math.sqrt(kousei1.reduce((sum, count, i) => sum + (count - kousei2[i]) ** 2, 0) / 12);
  }

  const chordProgressionSimilarity = (a, b) => {
    // 空白（''）を前のコードで埋める処理
    const filledChordP1 = a.chord.map((chord, i) => {
      let transposed = '';
      if (chord !== '') {
        transposed = chord;
      };
      if (i > 0) {
        transposed = a.chord[i - 1]
      };
      return transposed;
    });

    const filledChordP2 = b.chord.map((chord, i) => {
      let transposed = '';
      if (chord !== '') {
        transposed = chord;
      };
      if (i > 0) {
        transposed = b.chord[i - 1]
      };
      return transposed;
    });

    const t = a.key - b.key;

    return filledChordP1.reduce((sum, chord, i) => sum + chordSimilarity(chord, filledChordP2[i], t), 0) / filledChordP1.length;
  }

  const a = song1;
  const b = song2;
  return chordProgressionSimilarity(a, b);

}