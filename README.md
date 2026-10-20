# RecoverBot Live

RecoverBot Live is a browser-based visual recovery workspace. Its primary workflow uses an explicitly authorized webcam to observe a real tabletop row of colored objects, check a repeating pattern, identify the first mismatch, wait for the user to physically correct it, and verify the correction from a fresh frame.

The original deterministic colored-block simulator remains available under the **SIMULATOR** tab. Both experiences are honest about their authority: the camera workflow never claims that a physical object moved by itself, and the simulator keeps its existing validator/executor/verifier loop. RecoverBot does not claim to train a new VLA model.

## Requirements

- Node.js `22.23.3` (pinned in `.nvmrc` and the Dockerfile)
- npm 10+

## Setup

```bash
npm ci
cp .env.example .env       # optional; leave OPENAI_API_KEY blank for local mode
```

The API key is read only by the Node server. It is never bundled into the browser or returned by an API response.

## Run in development

```bash
npm run dev
```

Open <http://localhost:5173>. Vite serves the React UI and mounts the same server-only API handlers used by the production server. `http://localhost` is normally a secure context for webcam permissions; deployed domains generally need HTTPS.

## Run the production build

```bash
npm run build
npm run start
```

Open <http://localhost:4173>. `npm run start` serves `dist/` and the `/api/status`, `/api/plan`, and `/api/vision` routes.

## Test and check

```bash
npm test       # offline Node test suite
npm run build  # production browser bundle
# or
make test
```

The offline tests cover normal simulator completion, one-shot authoritative failure injection and recovery, protected-object and occupied-cell rejection, repeating-pattern correctness/mismatch/missing/duplicate/incomplete/ambiguous/uncertain cases, camera permission lifecycle, image validation, malformed vision output, API-unavailable status, and the five-case deterministic evaluation suite. They do not call OpenAI or require a physical camera.

## Optional AI mode

Create `.env` from `.env.example` and set the server-side values:

```dotenv
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-6-astra
PORT=4173
```

The server uses the official `openai` SDK and `client.responses.create(...)`. `/api/plan` retains the original strict action schema. `/api/vision` sends an actual on-demand `input_image` snapshot to the configured model and requests a strict structured scene observation. The image is size/type checked, credentials stay server-side, timeouts/errors return generic responses, and the client performs deterministic pattern arithmetic instead of trusting the model's mismatch claim. The configured model must support Responses API image input; if the call is unavailable, the UI says so and uses an explicitly labeled local color heuristic on the captured frame.

## Demo script: real-camera pattern recovery

1. Start the app with `npm run dev` and open `http://localhost:5173`.
2. Stay on the **LIVE** tab. The idle preview does not request camera permission.
3. Place six colored beads, blocks, or similar objects in one horizontal row, with enough space for each color to be visible. A practical demo arrangement is `RED → BLUE → YELLOW → RED → YELLOW → RED`.
4. Leave the expected manual cycle as `RED, BLUE, YELLOW`. Manual mode is safer than automatic inference for a presentation.
5. Click **Start camera** and approve the browser camera prompt. No audio is requested and no frames are uploaded yet.
6. Frame the row and click **Capture & analyze**. The app sends one resized snapshot to `/api/vision` when AI mode is configured; otherwise it applies the clearly labeled local color heuristic to that captured image.
7. The deterministic pattern checker highlights the first mismatch, for example position 5: observed `YELLOW`, expected `BLUE`, and enters **MISMATCH FOUND** / **WAITING FOR CORRECTION**.
8. Physically replace the incorrect item with `BLUE`. RecoverBot does not move it for you.
9. Click **Recheck fresh frame**. The app captures a new image, re-observes it, reruns the deterministic checker, and enters **VERIFIED** only when the fresh observation supports `RED → BLUE → YELLOW → RED → BLUE → YELLOW`.
10. Use **Stop camera** when finished. All media tracks are stopped; captured image data is not retained in the React state or event log.

If the camera cannot see the row clearly, the workflow stays in **NEEDS HELP** and asks for better framing/lighting rather than claiming success. The **Auto-analyze every 10s** option is off by default and only captures while the camera is active.

## Demo script: successful recovery

1. Start the app with `npm run dev`.
2. Confirm the task instruction contains the default goal and the model panel says **Local fallback planner** when no key is configured.
3. Click **Inject failure**. It arms a one-shot simulator fault; it does not fake an error in the UI.
4. Click **Start task**.
5. Watch the red block's first target move: the authoritative simulator places it at `C2` instead of `D2`.
6. Watch the state pill move through `VERIFYING → FAILURE DETECTED → RECOVERING → OBSERVING`.
7. The next fresh observation causes the local planner to propose `red → D2`; the board is not reset.
8. The blue and green moves are verified, then the independent completion check enters **VERIFIED SUCCESS**.
9. Read the event trace for expected vs. actual positions and the metrics for one injected failure, one detected failure, and one successful recovery.
10. Click **Run evaluation** to run the five deterministic cases. Each case must show `PASS`.

To demonstrate the normal path, click **Reset workbench**, then **Start task** without arming a failure.

## Architecture

- `src/world.js` — authoritative world, observation builder, occupancy rules, validator, deterministic executor, and verifier.
- `src/planner.js` — local fallback planner and model request payload schema.
- `src/engine.js` — explicit state machine, action/recovery budget, event log, metrics, and closed-loop orchestration.
- `src/evaluation.js` — deterministic evaluation scenarios using the same validator, executor, and verifier.
- `src/pattern.js` — deterministic repeating-cycle analyzer, ambiguity handling, mismatch classification, and explicitly limited local color heuristic.
- `src/liveCamera.js` — permission-gated video stream lifecycle, video-only constraints, frame capture, and camera error messages.
- `src/App.jsx` / `src/styles.css` — live camera workspace plus the preserved simulator UI.
- `server/api.mjs` — server-only planner and vision Responses API routes, image validation, strict schemas, and honest status/fallback behavior.
- `server.mjs` — production static server and API host.

## Deploy with Docker

```bash
docker build -t recoverbot .
docker run --rm -p 4173:4173 --env-file .env recoverbot
```

The image installs from the committed `package-lock.json`, builds the UI, and starts the production server. Do not bake secrets into the image.

## Known limitations

- The primary local detector assumes six roughly equal horizontal regions and saturated colored objects. It is a lightweight heuristic, not pixel-accurate object detection or tracking.
- Vision API availability depends on the configured account, network, and whether the selected model accepts image input. If unavailable, the UI labels the local heuristic instead of pretending it was model-generated.
- Automatic pattern inference requires repeated evidence and can return ambiguous/needs-help rather than silently choosing a rule.
- Webcam access requires a user gesture and browser permission. Deployed webcam access generally requires HTTPS; a plain HTTP LAN address may be rejected by the browser.
- The simulation uses direct legal placements rather than path-level collision motion. The animated block transition is presentation-only; the world mutation remains deterministic.
- The development server prints Node's normal notice when `.env` is absent because it uses Node's built-in optional env-file loader.
