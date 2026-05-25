# TMDB Photo Cropper

A fast, browser-based tool for preparing **2:3 person profile images for TMDB**.

The goal is simple: search a person, check whether they already have a TMDB profile photo, find a better image if needed, crop it quickly, export a clean JPG, and upload it back to TMDB.

Live app:

https://abbasmhosseini.github.io/tmdb-photo-cropper/

Repository:

https://github.com/AbbasMHosseini/tmdb-photo-cropper

## Why this project exists

Adding or improving profile photos on TMDB can take too many small steps:

1. Check if the person already has a photo.
2. Search Google Images or Bing Images for a usable portrait.
3. Download or upload the image.
4. Crop it to the correct 2:3 portrait ratio.
5. Export it in a clean size.
6. Open the person's TMDB media page and upload it.

This tool brings those steps into one small screen.

## Main features

- Search by person name
- Search by TMDB person URL
- Search by IMDb name URL or `nm...` ID
- Check TMDB profile image count through the TMDB API
- Show cached recent searches without repeatedly calling the API
- Use **Fetch Now** when fresh TMDB data is needed
- Open the TMDB person page and media profile page quickly
- Copy the TMDB person link from the ID button
- Search Google Images and Bing Images using `[name] photos`
- Upload an image file or paste an image URL
- Crop to 2:3 with a canvas editor
- Pan, zoom, reset, and export JPG
- Export sizes: 500 x 750, 1000 x 1500, 1500 x 2250

## Notes about TMDB API updates

TMDB may take some time to update its API after a new image is uploaded. The TMDB website can sometimes show a new image before the API returns it.

For that reason, the app separates cached history from fresh checks:

- Clicking a person in **Recent Searches** loads cached data only.
- Clicking **Fetch Now** requests fresh data from TMDB.

## API key / token

The app is static and runs on GitHub Pages. There is no backend.

To use TMDB checking, open the settings button in the app and paste either:

- TMDB v3 API Key
- TMDB API Read Access Token

The credential is saved only in your browser localStorage. Do not hardcode API keys in the repository.

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS
- HTML Canvas
- lucide-react icons
- GitHub Pages deployment

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown in Terminal.

## Build

```bash
npm run build
```

## Contributing

Contributions are welcome.

Good areas to improve:

- Better face detection or face-aware crop suggestions
- More reliable image loading and CORS-friendly workflows
- Improved keyboard shortcuts
- Better mobile layout
- Accessibility improvements
- Cleaner TMDB upload workflow helpers
- Better error messages and loading states

Please keep the project simple. The app should remain a fast, static, single-purpose tool without backend, database, login system, or heavy dashboard features.
