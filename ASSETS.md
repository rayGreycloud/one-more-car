# Frontier artwork — 2026-10-22

The two PNG assets below were generated for this game using the built-in OpenAI image-generation tool. They ship locally in the static build; the game makes no image-generation requests at runtime.

## Assets

- `public/assets/dusty-expressions.png`: transparent horizontal sheet of three matching Dusty portraits: welcome (left), cheer (center), and concern (right). CSS crops equal thirds using background positioning. Used for advice, onboarding, train briefings, results, and reward announcements.
- `public/assets/frontier-train.png`: illustrated frontier steam train. Used on the welcome screen, train briefings, and job ticket.

Card cargo art (gold, freight crates, contraband sacks, and provisions) is drawn in Phaser in `src/scene.js`. Dusty's advice comes from deterministic rules in `src/guide.js`; no network service or generated dialogue is needed while playing.

The generated files were visually inspected in the game. Keep the character sheet as one image so all three poses share the same loaded asset.

## Generation prompts

### Dusty

Use case: stylized-concept. Asset type: production game character expression sprite sheet, THREE equal square cells arranged horizontally in a wide 3:1 image. Primary request: an original friendly cartoon coyote cowboy guide named Dusty for an Old West train-heist card game. Same character, same scale and same outfit in all three cells. Waist-up portrait, expressive large ears, sandy golden fur, cream muzzle, round dark nose, oversized battered tan cowboy hat with a teal hatband, rusty red bandana, dark teal vest. Warm hand-painted 2D game illustration, crisp dark brown outlines, gentle cel shading, charming and readable at small sizes, vintage western storybook palette. LEFT cell: friendly reassuring smile, one paw tipping hat (welcome). MIDDLE cell: delighted grin, holding up a shiny gold coin (cheer). RIGHT cell: worried but kind raised eyebrow, open paw cautioning (concern). Each portrait centered within its own equal third with generous transparent padding on all sides. Complete hat and ears and paws contained in each cell. Bottom edge waist crop identical across cells. Genuinely transparent background, no border or backdrop, no lettering, no text, no labels, no watermarks. No guns. This must be a single aligned three-expression sprite sheet suitable for CSS cropping, NOT a comic panel.

### Frontier train

Use case: stylized-concept. Asset type: wide illustrated banner for an Old West train-heist card game. Primary request: a charming storybook steam train crossing the American frontier at golden hour. Wide panoramic composition, dark teal steam locomotive with brass details and warm maroon passenger carriages, large wooden trestle crossing a red sandstone gulch, sweeping ochre mesas, tiny frontier water tower and cacti, curling creamy steam. Train travels toward the right. Warm painterly 2D game art with crisp simplified shapes and subtle print texture, sophisticated cartoon western illustration, no photorealism. Rich rust, honey gold, dusty sage, dark teal, cream colors to complement an aged parchment game UI. Put the train and bridge in the central horizontal band, important subjects comfortably away from edges, sky gives airy negative space above. Wide landscape at least 2:1. No people, no guns, no text, no letters, no logos, no watermark. Polished production illustration.
