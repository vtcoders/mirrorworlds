[ -n "$1" ] || exit 1
sed $1 -e 's/@RGB_COLOR@/0 0 1/g'
