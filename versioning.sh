bash ./VERSION-GEN

echo "" >> ./dist/rhodonite.js
echo "(0,eval)('this').Rn.VERSION='"$(cat ./VERSION-FILE)" branch: "$(git symbolic-ref --short HEAD)"';" >> ./dist/rhodonite.js

echo "" >> ./dist/rhodonite.min.js
echo "(0,eval)('this').Rn.VERSION='"$(cat ./VERSION-FILE)" branch: "$(git symbolic-ref --short HEAD)"';" >> ./dist/rhodonite.min.js

echo "built branch: "$(git symbolic-ref --short HEAD)

echo "branch: "$(git symbolic-ref --short HEAD) >> VERSION-FILE
echo $(shasum -a 256 ./dist/rhodonite.js) >> VERSION-FILE
echo $(shasum -a 256 ./dist/rhodonite.min.js) >> VERSION-FILE
