# 🚀 PlazaYa v2.0 — Atualização Completa

## Resumo

Esta atualização traz todas as funcionalidades do ConcursosBrasil para o PlazaYa:
- Firebase (Analytics, Firestore, FCM Push Notifications)
- Tela de Estudo (StudyHome + StudyQuiz)
- Tela de Perfil com config de notificações
- Auth completo (cadastro, login, reset)
- Tela de detalhe da Convocatória (WebView)
- Push Notifications com tópicos por área
- Interstitial persistente (3 min)
- Modal de atualização forçada
- UTM tracking
- Cloud Functions para feeds RSS

---

## IDs do AdMob

### PlazaYa (México) — app.json usa estes:
- **App ID**: `ca-app-pub-9316035916536420~2327897668`
- **Banner**: `ca-app-pub-9316035916536420/4577955786`
- **Rewarded**: `ca-app-pub-9316035916536420/3401306180`
- **Interstitial**: `ca-app-pub-9316035916536420/2550558246`

### ConcursosBrasil — IDs separados:
- **App ID**: `ca-app-pub-9316035916536420~8124628178`
- **Banner**: `ca-app-pub-9316035916536420/2364067431`
- **Rewarded**: `ca-app-pub-9316035916536420/4784148966`
- **Interstitial**: `ca-app-pub-9316035916536420/2976243277`

---

## Passo a passo para atualizar

### 1. Criar projeto Firebase

1. Acesse https://console.firebase.google.com
2. Crie um novo projeto chamado "PlazaYa"
3. Adicione um app Android: `com.mycompany.concursosmx`
4. Baixe o `google-services.json` e substitua o arquivo placeholder
5. Habilite: Analytics, Firestore, Cloud Messaging

### 2. Executar SQL no Supabase

Cole o conteúdo de `supabase/schema_additions.sql` no SQL Editor do Supabase e execute.
Isso cria as tabelas: config, profiles, sessoes_estudo, questoes, usuarios + seed de questões.

### 3. Atualizar arquivos no GitHub (um por um)

Copie cada arquivo desta pasta para o repositório do PlazaYa via GitHub web:

#### Raiz do app:
- `app/App.js` → substitui o App.js atual
- `app/app.json` → substitui (ATUALIZE o projectId do EAS!)
- `app/package.json` → substitui (adiciona Firebase deps)
- `app/google-services.json` → novo arquivo (do Firebase Console)

#### Constants:
- `app/src/constants/colors.js` → substitui
- `app/src/constants/data.js` → substitui (agora tem dados BR + MX)

#### Context:
- `app/src/context/QuizContext.js` → substitui
- `app/src/context/AuthContext.js` → novo arquivo

#### Navigation:
- `app/src/navigation/index.js` → substitui (agora com todas as telas)

#### Services (todos novos):
- `app/src/services/notificationService.js`
- `app/src/services/analyticsService.js`
- `app/src/services/utmService.js`
- `app/src/services/supabaseService.js`
- `app/src/services/questionsService.js`
- `app/src/services/authService.js`

#### Hooks (novo):
- `app/src/hooks/useInterstitial.js`

#### Screens novos:
- `app/src/screens/ResultadoPerfilScreen.js`
- `app/src/screens/auth/AuthScreen.js`
- `app/src/screens/auth/CadastroScreen.js`
- `app/src/screens/main/NovedadesScreen.js`
- `app/src/screens/main/PerfilScreen.js`
- `app/src/screens/main/ConvocatoriaScreen.js`
- `app/src/screens/study/StudyHomeScreen.js`
- `app/src/screens/study/StudyQuizScreen.js`

#### Firebase:
- `firebase.json` → raiz do projeto
- `firestore.rules` → raiz do projeto
- `functions/index.js` → pasta functions/
- `functions/package.json` → pasta functions/

### 4. Instalar dependências novas

```bash
cd app
npm install
```

As novas deps são:
- `@react-native-firebase/app`
- `@react-native-firebase/analytics`
- `@react-native-firebase/firestore`
- `@react-native-firebase/messaging`
- `react-native-install-referrer`
- `patch-package`

### 5. Deploy Firebase Functions

```bash
cd functions
npm install
firebase login
firebase init  # selecione o projeto PlazaYa
firebase deploy --only functions
```

### 6. Build e publicar

```bash
cd app
# Incrementar versionCode em app.json para 2
eas build --platform android --profile production
```

Upload do AAB no Google Play Console.

---

## Estrutura final do PlazaYa v2.0

```
Splash → Quiz1-7 → RewardedAd → ResultadoPerfil → MainApp
                                                      ├── Inicio (HomeScreen)
                                                      ├── Estudiar (StudyHomeScreen)
                                                      │   └── StudyQuiz
                                                      ├── Novedades (NovedadesScreen)
                                                      │   └── Convocatoria (WebView)
                                                      └── Perfil (PerfilScreen)
                                                           ├── Auth
                                                           └── Cadastro

+ Botão flutuante 🧠 → QuizScreen (quiz de conhecimentos)
+ Interstitial a cada 3 minutos
+ Push notifications por área via FCM
```
