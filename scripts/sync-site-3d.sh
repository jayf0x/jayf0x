
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

REAL_SITE="$REPO_ROOT/site/.inspiration/htmlto-canvas"
PUBLIC_SITE="$REPO_ROOT/site-3d"

cd $REAL_SITE


rsync -av --exclude-from=.gitignore $REAL_SITE/ $PUBLIC_SITE


# cp -R src stages *.md "$PUBLIC_SITE"



if [ "$1" ]; then
    # has been changed by the command above
    # if find README.md -mmin -1 -ls; then
    #     echo "README is unchanged"
    #     exit
    # fi

    git add  site-3d
    git commit -m "(job): update site-3d"
    # redo due to precommit hook
    git add site-3d
    git add readme
    git push origin main
fi