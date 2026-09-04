#!/bin/zsh
cd "$(dirname "$0")/.."
osascript -e 'display notification "A abrir AT Analyser" with title "AT Analyser"'
npm start
