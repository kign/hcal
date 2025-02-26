#! /bin/bash -u

LIGHT_RED='\033[1;31m'
LIGHT_CYAN='\033[1;36m'
NC='\033[0m' # No Color

# inherited from parent shell, caused issues with 'cd'
CDPATH=''

# shellcheck disable=SC2164
cd "$( dirname "${BASH_SOURCE[0]}" )"/..
cwd=$(pwd)

type svgtoimg >/dev/null 2>&1 || { echo >&2 "svgtoimg not installed. Aborting (check out https://github.com/kign/inet-lab/tree/master/java-master)."; exit 1; }

printf "\n${LIGHT_CYAN}Generating icons${NC}\n"

mkdir -p ext/icons
svgtoimg -g 16,16 assets/01-tishrei.svg ext/icons/01-tishrei-16.png
svgtoimg -g 24,24 assets/01-tishrei.svg ext/icons/01-tishrei-24.png
svgtoimg -g 32,32 assets/01-tishrei.svg ext/icons/01-tishrei-32.png
svgtoimg -g 128,128 assets/01-tishrei.svg ext/icons/01-tishrei-128.png

for a in Ic_today_48px.svg location.svg location_y.svg sunrise.svg sunset.svg; do
	echo cp assets/$a ext/icons/
	cp assets/$a ext/icons/
done

echo "Generating location icons"
for color in orange black red navy steelblue; do
  printf "\tlocation_${color}.svg\n"
  m4 -DFILL=$color assets/location.svg.m4 > ext/icons/location_${color}.svg
done

echo
printf "\n${LIGHT_CYAN}Copying 3rd party JS libraries${NC}\n"

mkdir -p ext/lib
for s in hebcal.noloc.js moment.min.js suncalc.js; do
	echo cp external/$s ext/lib
	cp external/$s ext/lib
done

echo
printf "\n${LIGHT_CYAN}Linking ignlib.js from another Git project${NC}\n"

(
  cd ext/lib
  if [ ! -e ../../../dw-new-comments ]; then
    printf "${LIGHT_RED}Project https://github.com/kign/dw-new-comments is missing, clone it first${NC}"
    exit 1
  fi
  if [ ! -e ../../../dw-new-comments/ext/scripts/ignlib.js ]; then
    printf "${LIGHT_RED}Cannot locate file ignlib.js in project dw-new-comments${NC}"
    exit 1
  fi
  rm -f ignlib.js
  echo "Current directory: $(pwd)"
  echo "ln -s ../../../dw-new-comments/ext/scripts/ignlib.js ."
  ln -s ../../../dw-new-comments/ext/scripts/ignlib.js .
)

echo
echo "Done!"
