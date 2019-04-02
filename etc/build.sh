#! /bin/bash -u

cd "$( dirname "${BASH_SOURCE[0]}" )"
cd ..

type svgtoimg >/dev/null 2>&1 || { echo >&2 "svgtoimg not installed. Aborting."; exit 1; }

tmpfile=$(mktemp /tmp/xload.XXXXXXXXXX)
mkdir -p ext/icons
svgtoimg -g 128,128 assets/01-tishrei.svg ext/icons/01-tishrei-128.png

for a in Ic_today_48px.svg location.svg location_y.svg sunrise.svg sunset.svg; do
	echo cp assets/$a ext/icons/
	cp assets/$a ext/icons/
done

echo

mkdir -p ext/lib
for s in hebcal.noloc.js moment.min.js suncalc.js; do
	echo cp external/$s ext/lib
	cp external/$s ext/lib
done

echo "[ext/lib] ln -s ../../../dw-new-comments/ext/scripts/ignlib.js ."
cd ext/lib
rm -f ignlib.js
ln -s ../../../dw-new-comments/ext/scripts/ignlib.js .