# RecoverBot Live — 60-second presentation script

**0–8s — Title**  
RecoverBot Live is a closed-loop visual recovery agent for real tabletop tasks.

**8–18s — Observe**  
The user authorizes the webcam, frames a row of physical colored objects, and captures one explicit snapshot. No audio is recorded and frames are not continuously uploaded.

**18–30s — Detect**  
The observer extracts the left-to-right sequence. For the RED, BLUE, YELLOW cycle, it flags the first mismatch and shows the expected item beside the observed item.

**30–42s — Recover**  
The user physically corrects the object. RecoverBot never pretends to move a real object or to use a simulated camera feed.

**42–52s — Reverify**  
The user captures a fresh frame. The deterministic pattern engine checks the new observation, rather than trusting the previous result or the model's arithmetic.

**52–60s — Trust and reproducibility**  
Vision API mode uses a server-side Responses API image request. Without credentials, the app clearly labels its local color heuristic. The project includes a README, Dockerfile, pinned Node runtime, lockfile, tests, and simulator fallback.
