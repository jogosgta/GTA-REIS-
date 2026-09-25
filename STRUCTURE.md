# GTA REIS — Structure

```text
client/src/
  App.tsx                         rota única do jogo
  index.css                      reset + HUD mobile-first
  components/
    GameCanvas.tsx                lifecycle React/Babylon + overlay HUD
  game/
    scene.ts                      GameWorld, criação de cidade e loop
    assets.ts                     URLs e referências geradas
```

## Ownership

- **GameCanvas**: cria e destrói Engine uma única vez, registra botões touch, renderiza HUD DOM.
- **GameWorld**: possui estado de jogador, veículos, NPCs, missão, câmera, input e áudio.
- **Procedural factories**: criam materiais e meshes para casas, ruas, árvores, carro, moto e personagens.
- **Input**: ações semânticas (forward, back, left, right, sprint, interact, horn) unificam teclado e toque.
- **HUD**: DOM com IDs estáveis atualizados pelo mundo; não contém regra de gameplay.

## Estados

- `onFoot`: jogador visível, passos e interação com veículos/portas.
- `driving`: jogador oculto, veículo ativo dirige e emite som de motor.
- `mission`: checkpoints sequenciais na cidade; conclusão adiciona dinheiro e reputação.
- `demo`: autopilot opcional ativado por `?demo` para validação visual.

## Limites atuais

A cidade é procedural e local, sem banco de dados ou multiplayer. Assets pesados não entram no repositório: imagens geradas são armazenadas via Manus Storage e referenciadas por URL.
