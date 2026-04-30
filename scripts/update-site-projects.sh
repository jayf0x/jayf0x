#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

OWNER=$(gh repo view --json name -q ".name" | awk '{print $1}') # me
PATH_TEMP="$REPO_ROOT/__temp_repos"
PATH_OUT="$REPO_ROOT/site/src/assets/repos"


if [ "$OWNER" == "" ]; then
    echo "No OWNER found, fix this script."
    exit 1
fi


if ! [ -d "$PATH_TEMP" ]; then
    echo "Reusing temp files"
fi

exit

mkdir -p $PATH_TEMP
cd $PATH_TEMP

# download all the readme's to temp path
gh repo list "$OWNER" --limit 100 --json name,visibility \
  --jq '.[] | select(.visibility=="PUBLIC") | .name' | while read -r repo; do

    for branch in main master; do
        url="https://raw.githubusercontent.com/$OWNER/$repo/$branch/README.md"

        if curl -sfL "$url" -o "temp-${repo}.md"; then
            echo "Saved $repo README"
            break
        fi
    done
done


# call ollama for summary


mkdir -p "$PATH_OUT"
cd $PATH_OUT


rm -rf $PATH_TEMP