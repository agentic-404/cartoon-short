# Example: "Presiden Disadap: LIMS vs Spyware" (explainer, 47.5 s, 1426 frames, ID voiceover)
Third worked example, and the first non-story one: a night-city "stage" with three sites (police office, telecom operator + tower, phone house),
a paper that travels along a road, log books with lamps, and a spyware critter that flies over the tower and dives into the phone.
Only generic dark-tinted silhouette cards (no real people). Copy `web/` over the kit engine, then `cat toonbase.js roman.js > toon.js`.

Lessons (add to field notes):
- The vertical frame is narrow: half-width = d*tan(hfov/2). Keep sites ~9 m apart and use d~31, fov 54 for the wide shot; shoot site close-ups from z~15-16 at fov 42.
- Floating text boards: width*scale must stay under ~1.6x the camera half-width at that distance, or the ends crop (MENGHAPUS, TANPA KLIK, MENYETUJUI needed scale 0.4-0.7).
- Card characters read better at s=1.4 against 4-5 m buildings. Dark tint (#3a4266) makes an anonymous silhouette.
- Spyware/dark sections: a second light preset ('dark') plus red-orange skyline windows reads as "threat" without extra assets.
- check.py false positives here: a deliberately dark flat ground triggers "dark horizon band", and intended flashes trigger "flicker".
