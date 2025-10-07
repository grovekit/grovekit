set -eu

if ! docker ps | grep -w grovekit_local_npm_registry > /dev/null 2>&1; then
    echo "Local NPM registry does not exist. Creating..."
    docker run -d --rm \
        --name grovekit_local_npm_registry \
        -p "127.0.0.1:4873:4873" \
        verdaccio/verdaccio
    echo "\n\nNow run:\n\n    npm adduser --registry http://127.0.0.1:4873\n\n"
else
    echo "Local NPM registry already exists. Skipping."
fi
