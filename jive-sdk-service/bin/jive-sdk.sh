#!/usr/bin/env node
var cmd = require('../service/generator/jive-sdk');

var thisDir = process.cwd();
cmd.init(thisDir);