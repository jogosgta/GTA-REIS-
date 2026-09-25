# Game Plan: GTA REIS

## Direção do vertical slice

Uma cidade compacta e original, inspirada em São Paulo, com Centro, Paulista, bairros residenciais, comércio, viaduto, prédios, ônibus, câmera em terceira pessoa, exploração a pé, direção arcade de carro e moto, NPCs e HUD mobile-first.

## Risk Tasks

### 1. Câmera de perseguição em terceira pessoa
- **Why isolated:** A câmera precisa acompanhar jogador, carro e moto sem perder o alvo ou atravessar o cenário.
- **Approach:** Câmera FreeCamera controlada manualmente, com offset diferente para personagem e veículo, suavização de posição e alvo, e clamp simples dentro da cidade.
- **Verify:** Ao caminhar, entrar no carro e entrar na moto, a câmera acompanha o alvo correto, mantém o personagem visível e não fica parada em posição antiga.

### 2. Troca de estado a pé / veículo
- **Why isolated:** A transição pode deixar dois atores ativos, perder input ou posicionar o jogador dentro da geometria.
- **Approach:** Um estado explícito `onFoot`/`driving`, veículo ativo único, personagem oculto durante a direção e ponto de saída lateral do veículo.
- **Verify:** Aproximar-se de um veículo, pressionar E/F, dirigir, sair e voltar a caminhar sem duplicação, travamento ou teleporte estranho.

### 3. Física arcade de veículos
- **Why isolated:** Física completa de carro/moto exigiria plugin nativo e tuning delicado; o protótipo precisa responder bem no navegador e no toque.
- **Approach:** Aceleração, frenagem, direção com limite de velocidade e colisão visual simples por clamp; roda e carroceria animadas proceduralmente.
- **Verify:** Carro e moto aceleram, freiam e viram; rodas giram; o veículo não escapa da área jogável; controle de toque funciona.

### 4. Áudio no navegador
- **Why isolated:** AudioContext precisa de gesto do usuário e não deve quebrar a cena quando bloqueado.
- **Approach:** AudioManager Web Audio minimalista, desbloqueado no primeiro input, com tom de motor, buzina e passos procedurais; tudo opcional e tolerante a erro.
- **Verify:** Primeiro toque/tecla desbloqueia áudio sem erro; buzina e motor respondem ao estado do jogador; jogo continua silencioso de modo funcional se o navegador bloquear áudio.

## Main Build

- **Assets needed:** referência visual gerada, logo original GTA REIS, textura de parede/billboard, malhas procedurais para casas, carro, moto, personagem, NPCs, ruas, árvores, posto e marcadores.
- **Gameplay:** explorar a cidade, visitar casas, entrar em carro ou moto, completar checkpoints de entrega, acumular dinheiro e reputação, observar NPCs.
- **São Paulo:** skyline e marcos ficcionais, fachadas e asfalto texturizados, oficina, mercado, viaduto e corredores urbanos; nenhum endereço real é reproduzido em escala 1:1.
- **HUD:** nome do jogo, dinheiro, reputação, status da missão, minimapa simplificado, dica contextual e botões touch.
- **Verify:**
  - Movimento responde a WASD/setas e aos controles touch.
  - A câmera e o personagem respondem com transições suaves.
  - Carro e moto têm diferença de aceleração e direção.
  - Casas, posto, NPCs e ruas estão visíveis e sem materiais ausentes.
  - HUD legível em viewport desktop e mobile.
  - O marcador de missão atualiza checkpoints e dinheiro.
  - Não há erros de console durante a captura.
  - A escala dinâmica reduz a resolução interna quando o FPS cai, sem congelar o jogo.
  - A paleta usa midnight blue, teal, amber e coral, com identidade própria.
  - **Presentation proof:** capturas `/` e `/?demo` no preview WebDev.

## Fora do vertical slice

Multiplayer real, economia persistente, missões online, armas, voz, assets GLB, publicação direta em APK e backend ficam para fases posteriores. A base web permanece pronta para ser empacotada com Capacitor/Android Studio em etapa específica.
