# YouTube: literatúra s outrom

`style.txt` s hodnotou `youtube` vyberie `engine/` + `engine-youtube/`.
Príbeh používa pôvodný literárny engine bez zmien: atrament, akvarel, papier,
slovenský hlas a teal titulky. Platí `docs/style-guide.md`.

Za poslednou scénou sa automaticky pridá **12 sekúnd** záverečnej grafiky.
Začiatok prechádza z posledného záberu cez 0,7 s prelínanie. Outro má plnú
plynulosť 30 fps, bez sepiového filtra, hmly a titulkov z príbehu.

- Pozadie `#deeaee`, text `#16232a`, teal `#075056`, limetkové akcenty `#d7ef70`.
- Space Grotesk a oficiálne SVG logo v `engine-youtube/assets/logo.svg` (dodané používateľom: „07 — M s limetkovou fajkou.svg“). Logo sa zobrazuje bez prekresľovania a so zachovaným pomerom strán.
- Veľký nadpis vľavo, tri karty s ikonami vpravo, adresa v spodnom teal páse.
- Postupný nástup textov, kreslené podčiarknutie, prílet kariet s rotáciou, jemné plávanie, odhalenie adresy a pulzujúca šípka. Celá adresa je odhalená približne od štvrtej sekundy.
- „Maturita? Len formalitka.“ a „Viac nájdeš na maturitkaformalitka.sk“.
- Tri ponuky: „Videá“, „Maturitné témy“, „AI maturita“.
- „Priprav sa na maturitu na jednom mieste.“ a výzva na odber kanála.

Grafika vychádza z verejnej stránky maturitkaformalitka.sk overenej 11. 11. 2026.
Ide o pevnú záverečnú kartu; odkazy a odberové prvky YouTube Studio sa pridávajú
samostatne. Outro je bez hovoreného slova a bez hudby. `tools/youtube_audio.py` pridáva jemné
whoosh efekty pri nástupe loga, kariet a adresy, kreslenie podčiarknutia a krátke
cinknutia. Efekty sa časujú od začiatku outra z `audio/render-timing.json`, aj pri
prečasovaní hlasu. Pôvodný `audio/mix.wav` sa nemení; vznikne `audio/youtube-mix.wav`.
Build doplní potrebné ticho do konca obrazu, aby kratší mix neodrezal outro.

## Použitie

```sh
tools/new-video.sh moje-dielo youtube
# Uprav kópiu príkladu: script.json, shots.js a audio.py.
# Hlas, kontrolné zábery a build potom fungujú rovnako ako pri literatúre.
```

Pre existujúce video nastav `style.txt` na `youtube` a spusti
`SKIP_VOICE=1 tools/build.sh videos/<slug>`. Zachová sa uložený hlas. Keď používateľ povie, že video je na YouTube, vždy dodaj:

- `hotove-videa/<slug>-web.mp4`: pôvodný príbeh bez outra, na stránku.
- `hotove-videa/<slug>-youtube.mp4`: rovnaký príbeh a 12 s outro so zvukovými efektmi.

Oba súbory vzniknú jedným buildom zo spoločných vyrenderovaných scén. Verzia na
stránku používa pôvodný zvukový mix bez zvukov z outra.
`tools/stills.sh` podporuje aj zábery z outra: začína sa na pôvodnom konci videa.
Nový variant netreba ručne pridávať do `SHOTS` ani do zvukovej časovej osi.

Renderer pred prvým záberom čaká na `window.ASSETS_READY`, aby sa oficiálne logo načítalo aj pri paralelnom exporte.
