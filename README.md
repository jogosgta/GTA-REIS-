# GTA REIS

Jogo 3D de mundo aberto inspirado na vida urbana de São Paulo.

## Conteúdo

Este repositório contém o código do projeto em pastas: frontend React, cena Babylon.js, HUD, controles, missão, veículos, NPCs, configuração Capacitor e projeto Android.

## Preview

[Abra o preview jogável do GTA REIS](https://3000-i0cpskmu5ok9hwp801xuc-84be0451.us1.manus.computer/)

## Como usar o código

```bash
pnpm install
pnpm dev
```

## Gerar o APK debug

```bash
pnpm build
pnpm exec cap sync android
cd android
./gradlew assembleDebug
```

O APK debug gerado fica em `android/app/build/outputs/apk/debug/app-debug.apk`.

## Identidade Android

- Application ID: `com.gta.reis`
- Nome: `GTA REIS`
- Android mínimo: API 24
