# Assets

**Art direction:** mobile 3D open-world screenshot with an original São Paulo-inspired urban identity: midnight blue sky, asphalt and Portuguese-stone sidewalk textures, concrete apartment facades, teal streets and signage, amber lights, coral accents, crisp semi-realistic geometry, clean readable HUD, no copied characters, logos or assets.

## Generated

- `gta-reis-reference.png` — visual target: third-person avenue with player, teal car, red motorcycle, houses, gas station, NPCs and HUD. Generated with Manus built-in image generation.
- `gta-reis-logo.png` — original GTA REIS badge with crown and road stripe motif. Generated with transparent background. Runtime: `/manus-storage/gta-reis-logo_5d5f62ca.png`.
- `gta-reis-billboard.png` — original teal/coral wall texture for city props. Generated as a square opaque material. Runtime: `/manus-storage/gta-reis-billboard_7a578bad.png`.
- `gta-reis-reference.png` runtime archive: `/manus-storage/gta-reis-reference_147ef5e5.png`.
- `sp-facade-texture.png` — generated façade/air-conditioner/balcony material for the fictional São Paulo blocks. Runtime: `/manus-storage/sp-facade-texture_49c52796.png`.
- `sp-road-texture.png` — generated asphalt and Portuguese-stone sidewalk material. Runtime: `/manus-storage/sp-road-texture_208eee0b.png`.

## Runtime usage

The first playable slice uses procedural meshes and materials for performance. Generated imagery is kept outside the project until uploaded to Manus Storage; the logo and billboard texture will be wired into prominent UI/scene surfaces once the generation job returns storage URLs.
