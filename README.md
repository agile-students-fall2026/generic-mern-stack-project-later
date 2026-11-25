# Later

## Project Description
Later is a mobile web app for the places you and your friends keep sending each other but never get around to visiting. Instead of letting restaurant recommendations, thrift stores, and weekend ideas disappear in a group chat, you can paste a TikTok link into Later. The app identifies the place and adds it to a shared list and map for the right city. If it cannot identify the place, you can choose from suggested matches or search for it yourself.

Each city list has its own group of friends. Members can browse places on a map or in a list and vote “must-go,” “down for it,” or “hard pass.” Later brings the places your group is excited about into view, so when you finally have a free evening, you have somewhere to start.

### Product Vision Statement
Later helps friends turn places they discover online into places they actually visit. It makes saving a place effortless and helps a group see where everyone wants to go, starting with students exploring a city together.

## Team Members
- [Aashma Varma](https://github.com/aachoyo)
- [Siyona Goel](https://github.com/siyona-goel)
- [Zainab Aamer](https://github.com/ZainabAamer)
- [Aleena Leghari](https://github.com/aleenaleghari)
- [Inoo Jung](https://github.com/ij2298-oss)

## How the Project Came to be
As NYU students, we get the opportunity to study away in different countries for some semesters. In order to make the best of it, we often send our friends links to places we are dying to go to. However, even after sending each other all these suggestions, we always end up at our regular spot, completely forgetting about the place we wanted to go to, and then complaining that we do the same thing every time. We have reels saved from months ago about the thrift store in NYC that we mutually agreed was a must-go when we landed, but it's week 5 of classes and we've barely left Manhattan. And it's way too many taps to open Google Maps, type the name of the place, drop a pin and save it, especially when we're in the mood of doomscrolling. So the tiktoks pile up in the chat and nothing happens. The place never gets saved anywhere you'd actually look again, and even if it does get saved, nobody knows when to go, or if we should go at all.<br>

This barrier led to the birth of Later.

### Instructions on how to contribute to Later can be found in the [CONTRIBUTING.md](https://github.com/agile-students-fall2026/generic-mern-stack-project-later/blob/master/CONTRIBUTING.md) file.

## Run Later locally

Install Git and Node.js 26.5.1 with npm.<br> You also need a GitHub
account with read access to this repository. Check your installed tools with
`git --version`, `node --version`, and `npm --version`.

### 1. Clone the repository

```bash
git clone https://github.com/agile-students-fall2026/generic-mern-stack-project-later.git
cd generic-mern-stack-project-later
```

### 2. Start the backend

From the repository root, run:

```bash
cd back-end
npm install
cp .env.example .env
npm run dev
```

Leave this terminal running. Open <http://localhost:3000/api/config> to verify
that the backend returns JSON. The example configuration uses port 3000.

### 3. Start the frontend

Open a second terminal at the repository root and run:

```bash
cd front-end
npm install
cp .env.example .env
npm run dev
```

Open the **Local** URL printed by Vite. Keep both servers running while you
use the app. If you change the backend port, update `VITE_API_URL` in
`front-end/.env` to match and restart the frontend.

Copy each environment example once during setup. Share private configuration
values directly with teammates and keep real `.env` files out of Git.
Variables prefixed with `VITE_` are visible in the browser, so use them
only for public configuration.

### 4. Run backend tests and coverage

In another terminal at the repository root, run:

```bash
cd back-end
npm test
npm run coverage
```

The coverage command runs the tests and prints a coverage summary.

### 5. Build the frontend

From the repository root, run:

```bash
cd front-end
npm run build
```

Vite writes the production build to `front-end/dist/`.
