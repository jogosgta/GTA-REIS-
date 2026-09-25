# Assets

**Art direction:** original mobile 3D open-world roleplay game inspired by the genre of Grand Mobile, not a clone: human-scale third-person camera, dense São Paulo-inspired avenue, believable rounded vehicles, natural human character proportions, mixed-use apartment facades, parked traffic, pedestrians, bus stop and compact HUD. Realistic-stylized PBR materials with warm daylight, subtle ambient occlusion and mobile-safe geometry. No copied characters, logos, UI or proprietary assets.

## Generated

- `gta-reis-reference.png` — visual target: third-person avenue with player, teal car, red motorcycle, houses, gas station, NPCs and HUD. Generated with Manus built-in image generation.
- `gta-reis-logo.png` — original GTA REIS badge with crown and road stripe motif. Generated with transparent background. Runtime: `/manus-storage/gta-reis-logo_5d5f62ca.png`.
- `gta-reis-billboard.png` — original teal/coral wall texture for city props. Generated as a square opaque material. Runtime: `/manus-storage/gta-reis-billboard_7a578bad.png`.
- `gta-reis-reference.png` runtime archive: `/manus-storage/gta-reis-reference_147ef5e5.png`.
- `sp-facade-texture.png` — generated façade/air-conditioner/balcony material for the fictional São Paulo blocks. Runtime: `/manus-storage/sp-facade-texture_49c52796.png`.
- `sp-road-texture.png` — generated asphalt and Portuguese-stone sidewalk material. Runtime: `/manus-storage/sp-road-texture_208eee0b.png`.
- `gta-reis-rp-target.png` — new visual target for the RP reconstruction. Runtime: `/manus-storage/gta-reis-rp-target_bde92a56.png`.
- `gta-reis-car-reference.png` — rounded realistic compact sedan reference. Runtime: `/manus-storage/gta-reis-car-reference_d8355ce7.png`.
- `gta-reis-character-reference.png` — natural adult character reference. Runtime: `/manus-storage/gta-reis-character-reference_ac2016af.png`.
- `gta-reis-city-reference.png` — dense São Paulo-inspired urban environment reference. Runtime: `/manus-storage/gta-reis-city-reference_920d415d.png`.
- `gta-reis-player-cutout.png` — transparent hero character for the close third-person view. Runtime: `/manus-storage/gta-reis-player-cutout_d88a52a5.png`.
- `gta-reis-car-cutout.png` — transparent hero sedan visual layered over the playable car collider. Runtime: `/manus-storage/gta-reis-car-cutout_9f97e501.png`.

## Runtime usage

The first playable slice uses procedural meshes and generated textures for performance. The RP target and references drive scale, camera and density; actual native-quality 3D assets would require optimized GLB models, which are outside the built-in image generator path.
