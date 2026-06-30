# Projeto Julia — Comunicador por Movimento Ocular

Aplicação web **gratuita e open source** que permite a uma pessoa com limitações severas de fala e movimento responder **SIM** ou **NÃO** usando apenas o olhar.

- Olhar para a **direita da tela** por alguns segundos → **SIM**
- Olhar para a **esquerda da tela** por alguns segundos → **NÃO**

Ao confirmar, o app **fala** a resposta, **mostra** a palavra em letras grandes e aguarda um tempo (*cooldown*) antes de aceitar uma nova resposta.

> Toda a detecção acontece **localmente no navegador**. Nenhuma imagem da câmera é enviada para servidores. Não há APIs pagas nem chaves de acesso.

---

## ✨ Funcionalidades

- Acesso à câmera com mensagens de erro claras.
- **Calibração assistida** (centro → esquerda → direita) conduzida por um cuidador.
- Detecção contínua de **esquerda / centro / direita**.
- **Barra de progresso** (0%→100%) que zera se o olhar voltar ao centro.
- **Zona morta** central e **suavização** do sinal para tolerar movimentos lentos e evitar respostas acidentais.
- **Áudio** com a Web Speech API (voz em português); pronto para troca por MP3 no futuro.
- **Cooldown** configurável após cada resposta.
- **Painel de configurações** com tudo salvo no **LocalStorage**.
- **Modo de depuração**: mostra os pontos do rosto/íris e números da leitura.
- Botão para **inverter lados**, caso SIM/NÃO saiam trocados no equipamento real.

---

## 🚀 Como executar localmente

Pré-requisitos: **Node.js 18+** (recomendado 20+).

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em modo de desenvolvimento
npm run dev
```

Abra o endereço mostrado no terminal (ex.: `http://localhost:5173`).

> **Importante:** o acesso à câmera só funciona em **`localhost`** ou em **HTTPS**.
> Para testar no **tablet/celular** pela rede local, use HTTPS — uma opção simples é
> rodar `npm run build` e publicar no GitHub Pages (instruções abaixo), ou usar um
> túnel HTTPS (ex.: `npx localtunnel --port 5173`).

Para gerar a versão de produção:

```bash
npm run build      # gera a pasta dist/
npm run preview    # serve a build localmente para conferência
```

---

## 🌐 Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie este projeto.
2. No GitHub, vá em **Settings → Pages** e, em **Build and deployment**, selecione **GitHub Actions**.
3. A cada push na branch `main`, o workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) faz o build e publica automaticamente.
4. O site ficará em `https://SEU-USUARIO.github.io/NOME-DO-REPO/` (HTTPS, necessário para a câmera).

O `vite.config.ts` usa `base: './'`, então funciona em qualquer subcaminho do Pages sem ajustes.

---

## 🧭 Como usar (passo a passo)

1. Abra o site e toque em **Ativar câmera** (autorize o acesso).
2. Toque em **Recalibrar** e siga as 3 etapas:
   - peça ao paciente para olhar ao **centro** → **Capturar**;
   - olhar à **esquerda** → **Capturar**;
   - olhar à **direita** → **Capturar**.
3. Pronto. Peça uma pergunta de sim/não e observe a **barra de progresso** encher.
4. Se SIM/NÃO saírem **trocados**, abra **Configurações** e ative **Inverter lados**.
5. Ajuste **tempo de confirmação**, **sensibilidade**, **zona morta** e **cooldown** conforme o paciente.

---

## 🏗️ Arquitetura

A lógica é separada da interface por meio de **hooks** e **serviços**. O `App.tsx` apenas conecta as peças.

```
src/
├── components/   # UI pura (sem lógica de detecção)
│   ├── CameraView.tsx        # vídeo + canvas de depuração
│   ├── ProgressBar.tsx       # barra 0–100% com marcações
│   ├── AnswerDisplay.tsx     # SIM/NÃO em letras grandes
│   ├── SettingsPanel.tsx     # painel de configurações
│   ├── CalibrationWizard.tsx # assistente de calibração
│   └── DebugOverlay.tsx      # números da leitura
├── hooks/        # estado e ciclo de vida
│   ├── useSettings.ts          # configurações + LocalStorage
│   ├── useCamera.ts            # getUserMedia
│   ├── useEyeTracking.ts       # loop por quadro (MediaPipe → direção)
│   ├── useCalibration.ts       # fluxo de calibração assistida
│   ├── useConfirmationTimer.ts # barra de progresso + cooldown
│   └── useSpeech.ts            # fala (Web Speech API)
├── services/     # integração e cálculo
│   ├── faceLandmarker.ts     # cria/gerencia o detector do MediaPipe
│   └── gazeEstimator.ts      # razão da íris → direção/piscada/confiança
├── utils/
│   ├── storage.ts            # LocalStorage seguro
│   └── smoothing.ts          # média móvel + clamp
├── types/
│   └── index.ts              # tipos compartilhados
├── App.tsx
└── main.tsx
```

### Fluxo de dados (resumo)

1. `useCamera` abre a câmera e entrega o `<video>`.
2. `useEyeTracking` roda o **FaceLandmarker** a cada quadro, calcula a posição
   da **íris** dentro do olho (`gazeEstimator`), suaviza com **média móvel** e
   classifica em **esquerda/centro/direita** usando a **calibração**.
3. `useCalibration` lê a leitura atual para gravar os valores de cada direção.
4. `useConfirmationTimer` enche a **barra** enquanto o olhar fica num lado; ao
   chegar a 100%, dispara a resposta e entra em **cooldown**.
5. `App` exibe a resposta e, se habilitado, `useSpeech` a **fala**.

### Como a direção é detectada

Medimos a posição horizontal da **íris** em relação aos **cantos do olho**, nos
dois olhos, e tiramos a média. O vídeo é espelhado (como um espelho), então a
razão é convertida para o "espaço de exibição": **baixo = esquerda da tela**,
**alto = direita da tela**. A calibração define os limiares pessoais de cada
usuário; a **zona morta** e a **suavização** evitam disparos acidentais.

---

## 🔍 Biblioteca de rastreamento: por que MediaPipe?

Escolhemos **[MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe)** (`@mediapipe/tasks-vision`).

| Critério | MediaPipe Face Landmarker | WebGazer.js |
|---|---|---|
| Execução local | ✅ 100% no navegador | ✅ |
| Pontos de íris | ✅ precisos | ❌ (estima ponto na tela) |
| Precisão para esq/centro/dir | ✅ alta | ⚠️ baixa/instável |
| Manutenção | ✅ ativa (Google) | ⚠️ pouca |
| Falsos positivos | ✅ baixos (com zona morta) | ⚠️ altos |

Como **não** precisamos saber o ponto exato da tela (só três direções), os
pontos da íris do MediaPipe entregam um sinal mais limpo e robusto — ideal para
um paciente com movimentos lentos. De brinde, ainda obtemos **piscada**,
**confiança** e os **pontos para o modo de depuração**.

---

## 🔊 Melhorando a voz

A qualidade da fala depende das vozes instaladas no sistema/navegador. Em
**Configurações → Voz** você pode escolher manualmente; por padrão o app já
seleciona automaticamente a mais natural disponível.

- **Chrome:** costuma trazer **"Google português do Brasil"** (feminina e bem
  natural). Geralmente é a melhor opção — basta selecioná-la.
- **Windows:** para instalar vozes mais naturais, vá em
  **Configurações → Hora e idioma → Fala** (ou **Idioma**) e adicione vozes do
  pacote de **Português (Brasil)**. As vozes **"Natural/Online"** da Microsoft
  (ex.: *Francisca*) são bem melhores que a *Maria* padrão. Reinicie o navegador
  após instalar.
- **Edge:** oferece as vozes **"Online (Natural)"** da Microsoft, de ótima
  qualidade.

> Vozes "Online/Google" usam a internet para sintetizar. Para uso 100% offline,
> prefira uma voz local (mesmo que menos natural) ou, futuramente, arquivos MP3
> (a estrutura em `useSpeech.ts` já está pronta para essa troca).

## 🔒 Uso offline (opcional)

Por padrão, o modelo do MediaPipe e o runtime WASM são baixados de um CDN
gratuito na primeira execução e ficam em cache. Para uso **totalmente offline**:

1. Baixe o arquivo do modelo `face_landmarker.task` e os arquivos da pasta `wasm`
   do pacote `@mediapipe/tasks-vision`.
2. Coloque-os em `public/` e ajuste os caminhos em
   [`src/services/faceLandmarker.ts`](src/services/faceLandmarker.ts)
   (`WASM_PATH` e `MODEL_PATH`) para apontarem para os arquivos locais.

---

## 🧰 Tecnologias utilizadas

- **React 18** + **Vite** + **TypeScript**
- **@mediapipe/tasks-vision** (Face Landmarker) — rastreamento facial local
- **Web Speech API** (SpeechSynthesis) — fala da resposta
- **LocalStorage** — persistência das configurações e calibração

---

## ♿ Observações de acessibilidade e segurança

- Este projeto é uma **ferramenta de apoio à comunicação**, não um dispositivo
  médico. Use com supervisão e bom senso.
- Posicione a câmera na altura dos olhos, com boa iluminação frontal (evite luz
  forte atrás da pessoa).
- Ajuste **tempo de confirmação** e **sensibilidade** ao ritmo do paciente.

---

## 📄 Licença

Distribuído sob a licença **MIT**. Sinta-se livre para usar, adaptar e compartilhar.
