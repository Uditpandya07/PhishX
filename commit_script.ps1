$ErrorActionPreference = "Stop"

# 2
git add README.md
git commit -m "docs: update main README.md"

# 3
git add SECURITY.md
git commit -m "docs: enhance SECURITY.md protocols"

# 4
git add backend/app/api/deps.py
git commit -m "refactor(backend): optimize dependency injections in deps.py"

# 5
git add backend/app/api/v1/endpoints/scans.py
git commit -m "feat(backend): improve scan endpoints logic"

# 6
git add backend/app/api/v1/endpoints/ws.py
git commit -m "fix(backend): resolve memory leak in websocket endpoint"

# 7
git add backend/app/db/models.py
git commit -m "feat(backend): update database models for webhooks"

# 8
git add backend/app/schemas/scan.py
git commit -m "feat(backend): enhance scan schemas"

# 9
git add backend/app/schemas/user.py
git commit -m "feat(backend): enhance user schemas"

# 10
git add backend/app/worker.py
git commit -m "feat(backend): optimize celery worker execution"

# 11
git add docs/DEPLOYMENT.md
git commit -m "docs: update deployment instructions"

# 12
git add phishx-frontend/package-lock.json
git add phishx-frontend/package.json
git commit -m "chore(frontend): update dependencies in package.json"

# 13
git add phishx-frontend/src/app/page.jsx
git commit -m "feat(frontend): inject global ErrorPopup into main layout"

# 14
git add phishx-frontend/src/components/AdminPanel.jsx
git commit -m "refactor(frontend): implement new error popup in AdminPanel"

# 15
git add phishx-frontend/src/components/AuthModal.css
git commit -m "style(frontend): update AuthModal styles"

# 16
git add phishx-frontend/src/components/AuthModal.jsx
git commit -m "feat(frontend): improve AuthModal logic"

# 17
git add phishx-frontend/src/components/CookieBanner.jsx
git commit -m "feat(frontend): update CookieBanner logic"

# 18
git add phishx-frontend/src/components/PricingCards.jsx
git commit -m "refactor(frontend): integrate global error handling in PricingCards"

# 19
git add phishx-frontend/src/components/ScanPanel.css
git commit -m "style(frontend): update ScanPanel styles"

# 20
git add phishx-frontend/src/components/ScanPanel.jsx
git commit -m "refactor(frontend): replace alerts with ErrorPopup in ScanPanel and fix memory leaks"

# 21
git add phishx-frontend/src/components/SettingsModal.css
git commit -m "style(frontend): update SettingsModal styles"

# 22
git add phishx-frontend/src/components/SettingsModal.jsx
git commit -m "feat(frontend): improve SettingsModal UI"

# 23
git add phishx-frontend/src/views/Dashboard.css
git commit -m "style(frontend): update Dashboard styles"

# 24
git add phishx-frontend/src/views/Dashboard.jsx
git commit -m "refactor(frontend): add webhook capability card to Dashboard"

# 25
git add phishx-frontend/src/views/Documentation.jsx
git commit -m "docs(frontend): add SecOps Webhooks documentation"

# 26
git add phishx-frontend/src/views/Legal.css
git commit -m "style(frontend): enhance legal pages styling"

# 27
git add phishx-frontend/src/views/NewsPage.jsx
git commit -m "refactor(frontend): integrate ErrorPopup into CyberPulse fetch logic"

# 28
git add phishx-frontend/src/views/PrivacyPolicy.jsx
git commit -m "docs(frontend): add Third-Party Integrations section to PrivacyPolicy"

# 29
git add phishx-frontend/src/views/TermsOfService.jsx
git commit -m "docs(frontend): add Webhook Integrations & Liability clause to ToS"

# 30
git add phishx-frontend/src/components/ErrorPopup.jsx
git commit -m "feat(frontend): create global animated ErrorPopup component"

# 31
git add phishx-frontend/src/utils/errorHandler.js
git commit -m "feat(frontend): create errorHandler utility for global error dispatch"

# 32
if (Test-Path "phishx-frontend/src/components/Tour.jsx") {
    git add phishx-frontend/src/components/Tour.css
    git add phishx-frontend/src/components/Tour.jsx
    git commit -m "feat(frontend): add onboarding Tour component"
}

# Push the new branch to origin
git push origin feature/ui-ux-error-handling-and-webhook-docs

Write-Host "Done!"
