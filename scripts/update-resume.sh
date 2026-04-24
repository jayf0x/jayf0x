#/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
export PYTHONPATH="$SCRIPT_DIR/gen:$PYTHONPATH"

# means the HTML was updated more recent than the README, so no cache.
if [[ ./assets/resume.html -nt ./README.md ]]; then
    if ! ollama list > /dev/null; then
        ollama serve &
    fi
    python3 -m gen --no-cache
else
    python3 -m gen
fi

# Update site assets
# SITE_ASSETS="$REPO_ROOT/site/src/assets"

# for pdf in $REPO_ROOT/assets/*.pdf; do
#     rm -f $SITE_ASSETS/resume.pdf $TARGET/resume.png &> /dev/null
#     magick -density 300 -quality 100 "$pdf" "$SITE_ASSETS/resume.png"
#     cp "$pdf" "$SITE_ASSETS/resume.pdf"
#     break
# done

# python3 "$SCRIPT_DIR/precommit.py"



if [ "$1" ]; then
    # has been changed by the command above
    # if find README.md -mmin -1 -ls; then
    #     echo "README is unchanged"
    #     exit
    # fi

    git add -- . ':!site'
    git commit -m "(job: update resume) $1"
    # redo due to precommit hook
    git add -- . ':!site'
    git push origin main
fi