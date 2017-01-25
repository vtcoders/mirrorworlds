#!/usr/bin/env node

var mt = require('./motionTracker')

mt = new mt(8888, "./cameraSettings.csv");

mt.listenForBlobs(9999);
