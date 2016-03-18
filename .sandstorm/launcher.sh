#!/bin/bash
set -euo pipefail

export DBPATH=/var/wiredTigerDb
export HOME=/home/vagrant
mkdir -p $DBPATH
mongod --fork --logpath /tmp/mongod.log --dbpath $DBPATH --noauth --bind_ip 127.0.0.1 --nohttpinterface --wiredTigerEngineConfigString "log=(prealloc=false,file_max=200KB)" --wiredTigerCacheSizeGB 1 
cd /home/vagrant/bundle
rm -rf /var/tmp
mkdir /var/tmp
TMPDIR=/var/tmp ROOT_URL=http://127.0.0.1:8000 MONGO_URL=mongodb://127.0.0.1:27017 PORT=8000 node main
