#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
cp .env.example .env 2>/dev/null || true
npm install
node db/seed.js
npm start
