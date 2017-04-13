[ -n "$1" ] || exit 1
sed $1 -e 's/@RGB_COLOR@/1 0 0/g'
