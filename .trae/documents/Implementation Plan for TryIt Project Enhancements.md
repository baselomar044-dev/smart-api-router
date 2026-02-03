I have researched your requirements and created a comprehensive implementation plan.

# Phase 1: Critical Core Fixes (AI & Auth)
**1. Fix AI Assistant**
- **Issue**: The frontend currently bypasses the server and calls APIs directly, likely missing `VITE_` prefixed keys in your environment.
- **Fix**: 
    - Rename/Duplicate server keys in `.env` to include `VITE_` prefixes (e.g., `VITE_GEMINI_API_KEY`) so the frontend can see them.
    - **Better Fix**: Update `ChatPage.tsx` to use the server's robust `/api/chat/stream` endpoint (which handles errors & rate limits) instead of direct client calls.

**2. Implement Static Password (1606)**
- Modify `server/routes/auth.ts` to intercept the login request.
- If password is `1606`, bypass database hashing and grant immediate access with a "superuser" token.

# Phase 2: Voice & Agents
**3. Voice Call Configuration**
- Update `src/lib/voice-call.ts` and `VoiceCallPage.tsx`.
- **Enforce 4 Voices Only**:
  - **English**: "Adam" (Male), "Sarah" (Female).
  - **Arabic**: "Omar" (Male), "Layla" (Female) - specifically configured with Egyptian dialect prompts.
- Ensure the "Egyptian Dialogue" system prompt is active for Arabic calls.

**4. Agents System Overhaul**
- **Remove Templates**: Delete hardcoded `PRESET_AGENTS` in `server/lib/agent-system.ts` and `src/pages/AgentsPage.tsx`.
- **Enable Execution**: Update the "Run" button in `AgentsPage.tsx` to call a real backend endpoint (`POST /api/agents/:id/chat`) instead of the current simulation.

# Phase 3: Integrations & Features
**5. WhatsApp & Telegram Integration**
- **Frontend**: Add these 2 cards to the list in `src/pages/IntegrationsPage.tsx`.
- **Backend**: Implement the missing `case 'whatsapp'` and `case 'telegram'` logic in `server/routes/integrations.ts` to handle message sending.

**6. Memory System**
- **Manual**: Verify/Add a "Add Memory" button in `MemoryPage.tsx`.
- **Automatic**: Verify `auto-memory.ts` is active and listening to chat streams.

**7. Computer Use "Real" Preview**
- Connect `ComputerUsePage.tsx` to the existing (but unused) backend `server/routes/computer-use.ts`.
- Replace the static "placeholder image" with a live screenshot fetch from the backend (Puppeteer).

**8. Settings Enhancements**
- **QR Code**: Add `qrcode.react` component to `SettingsPage.tsx` to share the app URL.
- **API Keys**: Ensure all 11 keys in `aiMatrix.ts` are correctly loaded from `.env`.

# Phase 4: Finalization
**9. PWA & Mobile**
- Confirmed PWA is already configured. Will double-check `manifest.json` icons and mobile CSS.

**10. Deployment & Testing**
- Run full test suite.
- Provide a persistent deployment script (using Docker/Rail/Vercel configuration present in the repo).

**Shall I proceed with Phase 1 (AI & Auth) and Phase 2 (Voice & Agents) now?**