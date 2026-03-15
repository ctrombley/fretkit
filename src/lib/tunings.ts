const tunings: Record<string, Record<string, string[]>> = {
  guitar: {
    standard: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    dropped_d: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    open_g: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
    open_e: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'],
    major_thirds: ['E2', 'G#2', 'E3', 'G#3', 'E4', 'G#4'],
  },
  // Sonic Youth alternate tunings (source: sonicyouth.com/mustang/tab/tuning.html)
  // Strings listed low (6th) to high (1st). Some adjacent strings cross in pitch intentionally.
  sonic_youth: {
    // G G D D D# D# — foundational noise tuning, Kill Yr Idols through Sister/Dirty
    confusion:     ['G2', 'G2', 'D3', 'D3', 'D#4', 'D#4'],
    // F# F# F# F# E B — four unison low strings, EVOL through Dirty, 100+ songs
    starpower:     ['F#2', 'F#2', 'F#3', 'F#3', 'B3', 'E4'],
    // F# F# G G A A — rising cluster, Sister/Dirty (Schizophrenia, White Kross, Tom Violence)
    white_kross:   ['F#2', 'F#2', 'G3', 'G3', 'A3', 'A4'],
    // E G D G E D — open and resonant, Goo through Washing Machine (Dirty Boots, Diamond Sea)
    dirty_boots:   ['E2', 'G2', 'D3', 'G3', 'E4', 'D4'],
    // E G# E G# E G# — open E augmented, Expressway to Yr Skull, Pacific Coast Highway
    pacific:       ['E2', 'G#2', 'E3', 'G#3', 'E4', 'G#4'],
    // G A B D E G — major scale fragment, Daydream Nation (Teenage Riot, Sugar Kane)
    teenage_riot:  ['G2', 'A2', 'B2', 'D3', 'E4', 'G4'],
    // C C E B G D — dense chromatic cluster, Daydream Nation (The Sprawl, Cross the Breeze)
    the_sprawl:    ['C2', 'C3', 'E3', 'B3', 'G3', 'D4'],
    // C G D G C D — primary tuning Murray Street through The Eternal (many songs)
    murray_st:     ['C2', 'G2', 'D3', 'G3', 'C4', 'D4'],
    // D D# A# D# G G — dissonant semitone cluster, Rather Ripped (Incinerate, Pink Steam)
    rather_ripped: ['D2', 'D#2', 'A#2', 'D#3', 'G3', 'G4'],
    // D D A F# A D — open D6 quality, The Eternal (Sacred Trickster, Antenna, No Way)
    the_eternal:   ['D2', 'D2', 'A2', 'F#3', 'A3', 'D4'],
  },
  banjo: {
    standard: ['D3', 'G3', 'B3', 'D4'],
    double_c: ['C3', 'G3', 'C3', 'D4'],
  },
  mandolin: {
    standard: ['G3', 'D4', 'A4', 'E5'],
  },
};

export default tunings;
