# Relatório de desenvolvimento — GTA REIS

**Projeto:** GTA REIS  
**Repositório:** `jogosgta/GTA-REIS-`  
**Última atualização:** 25/09/2026  
**Versão do código:** `1be85de`

## Estado atual

O GTA REIS é um vertical slice 3D jogável para navegador e Android, ambientado em uma cidade inspirada em São Paulo. O projeto usa React, Babylon.js e Capacitor.

## Atualização mais recente

### Experiência mobile

- APK configurado para iniciar em **orientação paisagem**.
- HUD reorganizado para telas de celular.
- Novo **joystick analógico** para andar e dirigir.
- Botão separado de **Correr** usando o mesmo sistema de movimento.
- Botão de buzina com visual compacto.
- Aviso para girar o celular quando a tela estiver em modo retrato.

### Veículos

- Carro e moto continuam disponíveis na avenida inicial.
- O botão amarelo de interação fica oculto normalmente.
- O botão aparece apenas quando o personagem está próximo de um carro ou moto.
- Ao entrar no veículo, o botão muda para **Sair**.
- O HUD mostra o tipo do veículo próximo e o estado atual (`A PÉ`, `CARRO` ou `MOTO`).

### Gráficos e interface

- HUD com estética de simulador RP mobile.
- Minimapa circular, cartão de missão, indicadores de caixa e respeito.
- Controles com transparência, profundidade, bordas luminosas e feedback de toque.
- Cena urbana com avenida, casas, prédios, postes, veículos, NPCs, garagem e mercado.

## Validação

- `pnpm check` — aprovado.
- `pnpm build` — aprovado.
- Preview mobile em paisagem — validado visualmente.
- Entrada no carro pelo botão contextual — validada.
- APK debug paisagem — compilado com sucesso.

## APK de teste

O APK de teste foi gerado a partir desta versão do código. Para gerar localmente:

```bash
pnpm install
pnpm build
pnpm exec cap sync android
cd android
./gradlew assembleDebug
```

Arquivo gerado:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Regra de atualização

A partir deste relatório, toda alteração relevante do GTA REIS deve:

1. atualizar este arquivo com data, versão e resumo;
2. registrar a mudança no commit do Git;
3. enviar o código e o relatório juntos para o branch `main`;
4. atualizar o APK quando a alteração modificar o jogo Android.

## Próximas melhorias planejadas

- Câmera livre controlada por arrasto do dedo.
- Colisões mais detalhadas entre veículos, prédios e personagens.
- Garagem com compra, seleção e personalização de carros e motos.
- APK release assinado para distribuição pública.
