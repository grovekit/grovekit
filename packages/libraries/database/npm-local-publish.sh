set -eu

npm run build
npm publish --registry "http://127.0.0.1:4874"
