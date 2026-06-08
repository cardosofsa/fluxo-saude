# Fluxo Saúde — Guia de Deploy (Supabase + Vercel + APK)

Visão geral do que já está pronto no código:
- **Supabase**: cliente (`src/services/supabase.js`) + camada de dados (`src/services/db.js`) com **fallback automático para LocalStorage** quando as chaves não estão configuradas. Schema completo em `supabase_schema.sql`.
- **Vercel**: `vercel.json` configurado (SPA + Vite).
- **APK**: Capacitor configurado (`capacitor.config.json`, pasta `android/`) + workflow de build na nuvem (`.github/workflows/android-apk.yml`).

---

## 1. Banco de dados no Supabase

1. Crie uma conta em https://supabase.com e clique **New project**.
   - Dê um nome (ex.: `fluxo-saude`), defina uma senha de banco e a região (escolha `South America (São Paulo)`).
2. Abra o projeto → menu lateral **SQL Editor** → **New query**.
3. Cole **todo** o conteúdo de [`supabase_schema.sql`](./supabase_schema.sql) e clique **Run**.
   - Isso cria as tabelas (`units`, `beds`, `handovers`, `patients`, `digital_checkins`, `staff`) e já popula com os dados-semente.
4. Pegue as chaves em **Project Settings → API**:
   - **Project URL** → vira `VITE_SUPABASE_URL`
   - **anon public** key → vira `VITE_SUPABASE_ANON_KEY`
5. Local: copie `.env.example` para `.env` e preencha as duas variáveis. Rode `npm run dev` — o app passa a ler/gravar no Supabase. Sem as chaves, ele usa LocalStorage (modo protótipo).

> Observação de segurança: a `anon key` é pública (vai para o bundle). O schema desativa RLS para simplificar o protótipo. **Antes de produção real**, ativar RLS e mover autenticação/sigilo de dados de paciente para o backend (LGPD).

---

## 2. Deploy no Vercel (via GitHub)

1. Crie um repositório no GitHub e suba o código:
   ```bash
   git remote add origin https://github.com/<seu-usuario>/fluxo-saude.git
   git push -u origin main
   ```
   (O repositório já foi inicializado e commitado localmente.)
2. Em https://vercel.com → **Add New… → Project** → importe o repositório.
3. O Vercel detecta **Vite** automaticamente (build `npm run build`, output `dist`). Confirme.
4. Em **Environment Variables**, adicione:
   | Nome | Valor |
   |------|-------|
   | `VITE_SUPABASE_URL` | (sua Project URL) |
   | `VITE_SUPABASE_ANON_KEY` | (sua anon key) |
   | `VITE_OSRM_URL` | `https://router.project-osrm.org` |
   | `VITE_TILE_URL` | `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png` |
5. **Deploy**. A cada `git push` na branch `main`, o Vercel redeploya sozinho.

---

## 3. APK (Android, via Capacitor)

O app já está empacotado com Capacitor. O APK carrega o build web e **continua chamando o Supabase/OSRM pela rede**. Permissões de Internet e Localização já estão no `AndroidManifest.xml`.

### Opção A — Build na nuvem (recomendado, sem instalar nada)
1. No GitHub, vá em **Settings → Secrets and variables → Actions → New repository secret** e crie:
   - `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
2. Vá na aba **Actions → Build Android APK → Run workflow** (ou faça um push em `main`).
3. Ao terminar, baixe o APK em **Artifacts → fluxo-saude-debug-apk**.
4. Instale no celular (ative "Fontes desconhecidas").

### Opção B — Build local (precisa do Android Studio)
1. Instale o [Android Studio](https://developer.android.com/studio) (inclui o SDK).
2. Com o `.env` preenchido:
   ```bash
   npm run cap:open      # build + sync + abre no Android Studio
   ```
   No Android Studio: **Build → Build Bundle(s)/APK(s) → Build APK(s)**.
   Ou via terminal (após instalar o SDK):
   ```bash
   npm run apk:debug     # gera android/app/build/outputs/apk/debug/app-debug.apk
   ```

> O APK de **debug** serve para testes. Para publicar na Play Store, é preciso gerar um APK/AAB **assinado** (keystore) — passo posterior.
