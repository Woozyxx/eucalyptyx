# Eucalyptyx - Documentation du Projet

Plateforme de jeux sur grand écran (TV) destinée aux enfants de 6 à 12 ans du centre de loisirs "Eucalyptus" et de l'école Marie Curie à Pégomas.

## 🚀 Stack Technique

- **Framework :** React 18+ (TypeScript)
- **Outil de Build :** Vite
- **Styling :** Tailwind CSS v4 (Design System personnalisé pour TV)
- **Persistance :** LocalStorage (Gestion des défis)

## 🎨 Chartre Graphique & UI/UX (Sud & Nature)

L'application est optimisée pour une diffusion sur **téléviseur**. Les règles de design suivantes doivent être respectées :

- **Couleurs :**
  - Vert Eucalyptus : `emerald-500`, `teal-700`
  - Soleil de Pégomas : `amber-400`, `yellow-300`
  - Ciel d'Azur : `sky-100` à `blue-500`
- **Typographie :** 
  - Titres massifs (`text-9xl`), défis en `text-6xl`.
  - Graisses épaisses (`font-black`) pour une lisibilité à distance.
- **Composants :**
  - Bordures très arrondies (`rounded-[2rem]` ou `rounded-3xl`).
  - Effets de profondeur (`shadow-2xl` avec teintes colorées).
  - Glassmorphism (`bg-white/30 backdrop-blur-md`) pour les interfaces superposées.

## 🎡 Architecture des Écrans

1. **Dashboard (Accueil) :** Navigation par tuiles massives.
2. **La Roue des Défis :** 
   - Moteur SVG dynamique calculant les quartiers selon le nombre de défis.
   - Animation `ease-out` de 5 secondes.
   - Système de calcul d'index basé sur la rotation finale.
   - **Bouton Aléatoire (🔀) :** Permet de mélanger l'ordre des défis sur la roue pour plus de surprise.
3. **Panneau de Configuration :** 
   - CRUD complet des défis.
   - **Système de Presets :** Enregistrez plusieurs configurations de roue (ex: "Débutants", "Experts").
   - **Portabilité :** Exportez votre roue en fichier `.json` pour la charger sur un autre ordinateur.

## 🛠️ Commandes Utiles

```bash
# Lancer le développement
npm run dev

# Vérifier les types et builder pour la production
npm run build

# Prévisualiser le build localement
npm run preview
```

## 🔊 Audio & Sonorisation

L'application permet de personnaliser les sons de la roue et de la finale via des URLs directes dans les paramètres.

### Banques de sons recommandées :
1. **[Mixkit](https://mixkit.co/free-sound-effects/)** : (Recommandé) Très simple, sons modernes et joyeux.
2. **[Pixabay Sounds](https://pixabay.com/sound-effects/)** : Large choix de bruitages de haute qualité.
3. **[La Sonothèque](https://lasonotheque.org/)** : Banque française avec beaucoup de bruitages naturels.

### Comment obtenir une URL valide ?
Pour que le son fonctionne dans l'application, l'URL doit pointer directement vers le fichier (elle doit se terminer par `.mp3` ou `.wav`).
- Sur Mixkit : Faites un clic droit sur le bouton de téléchargement et choisissez **"Copier l'adresse du lien"**.
- Collez ensuite ce lien dans le champ correspondant dans les **Paramètres (⚙️)** de l'application.

## 📝 Conventions de Développement

- **Logique Métier :** Isoler les constantes de données (ex: `DEFAULT_CHALLENGES`) en haut de fichier.
- **Accessibilité :** Priorité absolue à la taille des cibles de clic et à la lisibilité des textes.
- **Performance :** Utiliser les animations CSS/Tailwind natives plutôt que des bibliothèques lourdes pour garantir la fluidité sur les processeurs de TV connectées.
