const chords: Record<string, string[]> = {
  'M': ['1', '3', '5'],
  'm': ['1', '♭3', '5'],
  '7': ['1', '3', '5', '♭7'],
  'M7': ['1', '3', '5', '7'],
  'm7': ['1', '♭3', '5', '♭7'],
  '°7': ['1', '♭3', '♭5', '𝄫7'],
  'ø7': ['1', '♭3', '♭5', '♭7'],
  'mM7': ['1', '♭3', '5', '7'],
  '+M7': ['1', '3', '♯5', '7'],
  '6': ['1', '3', '5', '6'],
  'm6': ['1', '♭3', '5', '6'],
};

chords['major'] = chords['M']!;
chords['Major'] = chords['M']!;
chords['maj'] = chords['M']!;
chords['Maj'] = chords['M']!;
chords['minor'] = chords['m']!;
chords['Minor'] = chords['m']!;
chords['min'] = chords['m']!;
chords['Min'] = chords['m']!;
chords['7th'] = chords['7']!;
chords['seventh'] = chords['7']!;
chords['dominant seventh'] = chords['7']!;
chords['major 7th'] = chords['M7']!;
chords['major seventh'] = chords['M7']!;
chords['maj7'] = chords['M7']!;
chords['Δ'] = chords['M7']!;
chords['Δ7'] = chords['M7']!;
chords['⑦'] = chords['M7']!;
chords['7+'] = chords['M7']!;
chords['minor 7th'] = chords['m7']!;
chords['minor seventh'] = chords['m7']!;
chords['min7'] = chords['m7']!;
chords['-7'] = chords['m7']!;
chords['diminished 7th'] = chords['°7']!;
chords['diminished seventh'] = chords['°7']!;
chords['dim7'] = chords['°7']!;
chords['half diminished 7th'] = chords['ø7']!;
chords['half-diminished seventh'] = chords['ø7']!;
chords['ø'] = chords['ø7']!;
chords['m7♭5'] = chords['ø7']!;
chords['m7b5'] = chords['ø7']!;
chords['-7♭5'] = chords['ø7']!;
chords['-7b5'] = chords['ø7']!;
chords['minor major 7th'] = chords['mM7']!;
chords['minor major seventh'] = chords['mM7']!;
chords['mmaj7'] = chords['mM7']!;
chords['mΔ7'] = chords['mM7']!;
chords['-Δ7'] = chords['mM7']!;
chords['augmented major 7th'] = chords['+M7']!;
chords['augmented major seventh'] = chords['+M7']!;
chords['maj7♯5'] = chords['+M7']!;
chords['+Δ7'] = chords['+M7']!;
chords['M6'] = chords['6']!;
chords['major 6th'] = chords['6']!;
chords['minor 6th'] = chords['m6']!;

export default chords;
