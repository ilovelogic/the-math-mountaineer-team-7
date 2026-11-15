# Sound credits

Every sound here is by [Kenney](https://kenney.nl) and released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (public domain), so the game can use, change and share them freely. Credit isn't required, but Kenney asks that anyone who gives it mention "Kenney" or "kenney.nl".

| File | Plays when | Made from | Pack |
|---|---|---|---|
| `fits.mp3` | The log fits | `impactWood_medium_002.ogg`, then `confirmation_001.ogg` 0.06 s later | [Impact Sounds](https://kenney.nl/assets/impact-sounds), [Interface Sounds](https://kenney.nl/assets/interface-sounds) |
| `too-short.mp3` | The log is too short and falls | `phaserDown3.ogg`, then `impactSoft_heavy_003.ogg` 0.42 s later | [Digital Audio](https://kenney.nl/assets/digital-audio), [Impact Sounds](https://kenney.nl/assets/impact-sounds) |
| `too-long.mp3` | The log is too long | `impactPlank_medium_001.ogg` | [Impact Sounds](https://kenney.nl/assets/impact-sounds) |
| `level-done.mp3` | A level is done | `jingles_STEEL02.ogg` | [Music Jingles](https://kenney.nl/assets/music-jingles) |
| `medal.mp3` | The medal screen opens | `jingles_SAX07.ogg` | [Music Jingles](https://kenney.nl/assets/music-jingles) |

## How they were changed

Each sound was converted to mono, trimmed of silence at both ends, given a 10 ms fade-out, and set to the same loudness (about -20 dB RMS, peaks below -1 dBFS), so no cue is louder than the others. `too-long.mp3` was then turned down another 3 dB, since a short crack sounds louder than its level suggests. `fits.mp3` and `too-short.mp3` each layer two of the sounds above. The files are 128 kbps MP3, because some Safari versions can't play the packs' original Ogg files.
