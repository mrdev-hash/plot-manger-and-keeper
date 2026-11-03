<div align="center">

# 📍 PlotKeeper

### Photograph a plot. Its location saves with it. Navigate back anytime.

A simple offline Android app for real estate agents and land buyers to catalog plots with photos, GPS locations and notes.

![Platform](https://img.shields.io/badge/platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-Expo-1B7F5A?style=for-the-badge&logo=expo&logoColor=white)
![Offline](https://img.shields.io/badge/works-offline-E8B422?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)

</div>

---

## ✨ Features

| | Feature | What it does |
|---|---|---|
| 📸 | **Photo capture** | Take a photo or pick one from the gallery |
| 🛰️ | **Auto location** | GPS coordinates are saved the moment the photo is taken |
| 🏷️ | **Name and notes** | Give every plot a name, add size, owner or price notes |
| 🗂️ | **Plot catalog** | Browse all your plots in one clean list |
| 🔎 | **Search** | Find a plot by name instantly |
| 🚦 | **Status tags** | Mark plots as Available, Visit soon or Sold |
| 🧭 | **One-tap navigation** | Opens Google Maps with directions to the plot |
| 📤 | **Share** | Send a plot's map link on WhatsApp or anywhere |
| 📴 | **Offline first** | All data stays on your phone, no account needed |

---

## 🖼️ Screenshots

<div align="center">

| Home | Add plot | Plot details |
|:---:|:---:|:---:|
| ![Home](screenshots/home.png) | ![Add](screenshots/add.png) | ![Details](screenshots/details.png) |

</div>

> Add your own screenshots to a `screenshots/` folder and the images above will show up.

---

## 🚀 Getting started

### Requirements

- [Node.js](https://nodejs.org) (LTS version)
- [Expo Go](https://expo.dev/go) on your Android phone (for testing)

### Run the app

```bash
git clone https://github.com/mrdev-hash/plot-manger-and-keeper.git
cd plot-manger-and-keeper
npm install
npx expo start
```

Scan the QR code with the Expo Go app. If your phone can't connect, use:

```bash
npx expo start --tunnel
```

---

## 📦 Build an APK

Create a standalone APK that installs like any normal app, with no Expo Go needed.

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Download the `.apk` from the link when the build finishes and share it with anyone.

For the Play Store, build an app bundle instead:

```bash
eas build -p android --profile production
```

---

## 🛠️ Built with

- [React Native](https://reactnative.dev) and [Expo](https://expo.dev)
- `expo-image-picker` for camera and gallery
- `expo-location` for GPS
- `expo-file-system` to keep photos on the device
- `@react-native-async-storage/async-storage` for saved plots
- Google Maps link for directions, no API key needed

---

## 📁 Project structure

```
plot-manger-and-keeper/
├── App.js          # The whole app: list, add flow, navigation
├── app.json        # App name, package id, permissions
├── eas.json        # Build profiles (APK and AAB)
├── assets/         # Icon and splash images
└── package.json
```

---

## 🔐 Privacy

PlotKeeper stores photos and locations only on your device. It has no accounts, no servers and no tracking. The only time it goes online is when you tap **Navigate** and Google Maps opens.

**Permissions used:** Camera (take plot photos) and Location (save plot position).

---

## 🗺️ Roadmap

- [x] Photo capture with automatic GPS
- [x] Plot catalog with search and status
- [x] Google Maps navigation and sharing
- [x] Offline APK
- [ ] Map screen showing all plots as pins
- [ ] Multiple photos per plot
- [ ] Edit plot details
- [ ] Export plots to PDF or CSV
- [ ] Cloud backup and sync
- [ ] Play Store release

---

## 🤝 Contributing

Ideas and pull requests are welcome. Open an issue to discuss what you'd like to change.

---

## 📄 License

Released under the [MIT License](LICENSE).

<div align="center">

Made with ❤️ by [mrdev-hash](https://github.com/mrdev-hash)

</div>
