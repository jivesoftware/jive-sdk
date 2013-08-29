#!/usr/bin/env node
var cmd = require('../jive-sdk-service/generator/jive-sdk');

var thisDir = process.cwd();
cmd.init(thisDir);