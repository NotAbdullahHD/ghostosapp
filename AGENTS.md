# Project rules

- Keep browser-device readings in a browser-only effect hook, with unavailable readings omitted; web apps cannot control host Wi-Fi or invent hardware telemetry.
- Desktop controls use the shared Button desktop variant and semantic chrome tokens; this keeps the reference styling consistent.
- Bundle icon URLs through Vite and provide glyph fallbacks; deployment must not depend on Lovable-only asset paths.
- Clock font pointers use an absolute published asset origin, so font requests work on external deployments too.