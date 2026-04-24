
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

REAL_SITE="$REPO_ROOT/site/.inspiration/htmlto-canvas"
PUBLC_SITE="$REPO_ROOT/site-3d"

cd $REAL_SITE


rsync -av --exclude-from=.gitignore $REAL_SITE/ $PUBLC_SITE


# cp -R src stages *.md "$PUBLC_SITE"