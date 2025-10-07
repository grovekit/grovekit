set -eu

VERSION=$(node -e "process.stdout.write(require('./package.json').version)")

docker build --network=host -t "grovekit-scribe:$VERSION" --build-arg VERSION="$VERSION" .
