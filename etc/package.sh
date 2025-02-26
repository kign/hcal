#! /bin/bash -u

LIGHT_RED='\033[1;31m'
LIGHT_CYAN='\033[1;36m'
NC='\033[0m' # No Color

# inherited from parent shell, caused issues with 'cd'
CDPATH=''

# shellcheck disable=SC2164
cd "$( dirname "${BASH_SOURCE[0]}" )"/..
root=$(pwd)

type zip >/dev/null 2>&1 || { echo >&2 "'zip' not installed. Aborting."; exit 1; }

printf "\n${LIGHT_CYAN}Generating ZIP package${NC}\n"
cd $root/ext
echo "Current directory: $(pwd)"
zip=../hcal.zip

rm -f $zip
echo zip -r $zip .
zip -r $zip .

printf "\n\n"

ls -l $zip

printf "\nDone!\n"

