# 🚀 Guia de Setup — Concursos México

## Pré-requisitos

| Ferramenta    | Versão mínima | Instalação                              |
|---------------|---------------|-----------------------------------------|
| Node.js       | 18+           | https://nodejs.org                      |
| Git           | qualquer      | https://git-scm.com                     |
| Expo CLI      | —             | `npm install -g expo-cli`               |
| EAS CLI       | —             | `npm install -g eas-cli`                |
| Android Studio| Hedgehog+     | (para emulador local)                   |

---

## 1. Clonar o repositório

```bash
git clone https://github.com/SEU-USUARIO/concursos-mexico.git
cd concursos-mexico/app
```

---

## 2. Instalar dependências

```bash
npm install
```

---

## 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com seus valores:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
```

---

## 4. Configurar Supabase

1. Acesse https://supabase.com e crie um projeto
2. Vá em **SQL Editor** e cole o conteúdo de `../supabase/schema.sql`
3. Execute o script → todas as tabelas e questões seed serão criadas
4. Em **Project Settings > API**, copie a `URL` e a `anon key` para o `.env`
5. Em **Authentication > Email**, habilite confirmação de email se quiser

---

## 5. Configurar AdMob

1. Acesse https://admob.google.com
2. Crie um app Android com nome "Concursos México"
3. Crie 3 blocos de anúncio: **Banner**, **Rewarded**, **Interstitial**
4. Atualize os IDs em `src/constants/data.js`:

```js
export const ADMOB_IDS = {
  APP_ID:       'ca-app-pub-XXXXX~XXXXX',
  BANNER:       'ca-app-pub-XXXXX/XXXXX',
  REWARDED:     'ca-app-pub-XXXXX/XXXXX',
  INTERSTITIAL: 'ca-app-pub-XXXXX/XXXXX',
};
```

5. Atualize o `androidAppId` em `app.json`:

```json
"react-native-google-mobile-ads": {
  "androidAppId": "ca-app-pub-XXXXX~XXXXX"
}
```

---

## 6. Rodar localmente

```bash
# Iniciar o Metro bundler
npx expo start --android

# Ou com cache limpo (após mudanças em app.json)
npx expo start --android --clear
```

---

## 7. Build para Play Store

```bash
# Login no EAS
eas login

# Configurar projeto (apenas uma vez)
eas build:configure

# APK de teste (distribuição interna)
eas build --platform android --profile preview

# AAB de produção (Play Store)
eas build --platform android --profile production
```

O arquivo `.aab` gerado deve ser enviado no **Google Play Console > Versões de produção**.

---

## 8. Deploy do site no Vercel

1. Acesse https://vercel.com e faça login com GitHub
2. Clique em **Add New Project**
3. Importe o repositório `concursos-mexico`
4. Em **Root Directory**, selecione `web`
5. Clique em **Deploy**

O Vercel detecta automaticamente HTML estático. As rotas estão configuradas em `web/vercel.json`.

---

## 9. Domínio personalizado (opcional)

No painel do Vercel:
- **Settings > Domains** → adicione seu domínio
- Configure o DNS apontando para os servidores do Vercel

---

## 10. Subir para GitHub

```bash
# Na raiz do projeto
git init
git add .
git commit -m "feat: estrutura inicial Concursos México"
git remote add origin https://github.com/SEU-USUARIO/concursos-mexico.git
git push -u origin main
```

---

## Checklist antes de publicar na Play Store

- [ ] IDs do AdMob reais em `data.js` e `app.json`
- [ ] Supabase configurado (schema.sql executado)
- [ ] `.env` com chaves reais (nunca subir para o GitHub!)
- [ ] `package` em `app.json` com nome único (`com.suaempresa.concursosmx`)
- [ ] `versionCode` incrementado a cada novo build
- [ ] Ícone e splash screen personalizados em `assets/`
- [ ] Política de privacidade publicada (URL do site Vercel)
- [ ] Site no Vercel publicado com a URL correta
- [ ] Teste em dispositivo físico antes do build de produção

---

## Estrutura de arquivos principal

```
concursos-mexico/
├── .gitignore
├── README.md
├── SETUP.md                          ← este arquivo
│
├── supabase/
│   └── schema.sql                    ← rodar no Supabase
│
├── web/                              ← deploy no Vercel
│   ├── index.html
│   ├── exclusion-de-datos.html
│   └── vercel.json
│
└── app/                              ← React Native (Expo)
    ├── App.js
    ├── app.json
    ├── eas.json
    ├── package.json
    ├── babel.config.js
    ├── .env.example
    └── src/
        ├── components/
        │   ├── QuizLayout.js
        │   └── OptionButton.js
        ├── constants/
        │   ├── colors.js
        │   └── data.js
        ├── context/
        │   ├── AuthContext.js        ← estado de login
        │   └── QuizContext.js        ← respostas do onboarding
        ├── navigation/
        │   └── index.js              ← todas as rotas
        ├── screens/
        │   ├── SplashScreen.js
        │   ├── RewardedAdScreen.js
        │   ├── quiz/                 ← 7 telas de perfil
        │   │   ├── Quiz1Screen.js
        │   │   ├── Quiz2Screen.js
        │   │   ├── Quiz3Screen.js
        │   │   ├── Quiz4Screen.js
        │   │   ├── Quiz5Screen.js
        │   │   ├── Quiz6Screen.js
        │   │   └── Quiz7Screen.js
        │   ├── knowledge/
        │   │   └── KnowledgeQuizScreen.js  ← quiz antes do cadastro
        │   ├── auth/
        │   │   └── AuthScreen.js           ← cadastro e login
        │   ├── main/
        │   │   ├── HomeScreen.js           ← tela principal
        │   │   └── OtherScreens.js         ← novidades, estado, perfil
        │   └── study/
        │       ├── StudyHomeScreen.js      ← hub de estudo
        │       └── StudyQuizScreen.js      ← quiz de estudo/simulado
        └── services/
            ├── supabase.js               ← cliente Supabase
            ├── authService.js            ← login/cadastro
            └── questionsService.js       ← questões híbridas + histórico
```
