bash ./VERSION-GEN

SET_RN_VERSION="(0,eval)('this').Rn.VERSION='"$(cat ./VERSION-FILE)""
BRANCH="branch: $(git symbolic-ref --short HEAD)"

echo "" >> ./dist/esm/index.js
echo ${SET_RN_VERSION}" "${BRANCH}"';" >> ./dist/esm/index.js

mkdir -p ./dist/umd

echo "" >> ./dist/umd/rhodonite.js
echo ${SET_RN_VERSION}" "${BRANCH}"';" >> ./dist/umd/rhodonite.js

echo "" >> ./dist/umd/rhodonite.min.js
echo ${SET_RN_VERSION}" "${BRANCH}"';" >> ./dist/umd/rhodonite.min.js

echo "built ${BRANCH}"

echo ${BRANCH} >> VERSION-FILE
echo "Get-FileHash -Algorithm SHA256 ./dist/esm/index.js" >> VERSION-FILE
echo "Get-FileHash -Algorithm SHA256 ./dist/umd/rhodonite.js" >> VERSION-FILE
echo "Get-FileHash -Algorithm SHA256 ./dist/umd/rhodonite.min.js" >> VERSION-FILE
