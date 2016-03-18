#!/bin/bash
set -euo pipefail

# Make meteor bundle
cd /opt/app

if [ -e package.json ]; then
  meteor npm install
fi

export BASEPATH=$(meteor node -e 'c=process.execPath.split("/"); console.log(c.slice(0, c.length-1).join("/"))')
sudo ln -sf $BASEPATH/node /usr/local/bin
sudo ln -sf $BASEPATH/npm /usr/local/bin

meteor build --directory /home/vagrant/
cd /home/vagrant/bundle/programs/server
npm install
