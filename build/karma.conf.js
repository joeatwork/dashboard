// Copyright 2015 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Configuration file for Karma test runner.
 *
 * Specification of Karma config file can be found at:
 * http://karma-runner.github.io/latest/config/configuration-file.html
 */
import path from 'path';
import wiredep from 'wiredep';

import conf from './conf';

/**
 * Returns an array of files required by Karma to run the tests.
 *
 * @return {!Array<string>}
 */
function getFileList() {
  // All app dependencies are required for tests. Include them.
  let wiredepOptions = {
    dependencies: true,
    devDependencies: true,
  };

  return wiredep(wiredepOptions).js.concat([
    path.join(conf.paths.frontendTest, '**/*.js'),
    path.join(conf.paths.frontendSrc, '**/*.js'),
    path.join(conf.paths.frontendSrc, '**/*.html'),
  ]);
}

/**
 * Exported default function which sets Karma configuration. Required by the framework.
 *
 * @param {!Object} config
 */
module.exports = function(config) {
  let configuration = {
    basePath: '.',

    files: getFileList(),

    logLevel: 'WARN',

    frameworks: ['jasmine', 'browserify'],

    browsers: ['Chrome'],

    browserNoActivityTimeout: 60 * 1000,  // 60 seconds.

    customLaunchers: {
      // Custom launcher for Travis CI. It is required because Travis environment cannot use
      // sandbox.
      chromeTravis: {
        base: 'Chrome',
        flags: ['--no-sandbox'],
      },
    },

    reporters: ['progress', 'coverage'],

    coverageReporter: {
      dir: conf.paths.coverage,
      reporters: [
        {type: 'html', subdir: 'html'},
        {type: 'lcovonly', subdir: 'lcov'},
      ],
    },

    preprocessors: {},  // This field is filled with values later.

    plugins: [
      'karma-chrome-launcher',
      'karma-jasmine',
      'karma-coverage',
      'karma-ng-html2js-preprocessor',
      'karma-sourcemap-loader',
      'karma-browserify',
    ],

    // karma-browserify plugin config.
    browserify: {
      // Add source maps to outpus bundles.
      debug: true,
      // Make 'import ...' statements relative to the following paths.
      paths: [conf.paths.frontendSrc, conf.paths.frontendTest],
      transform: [
        // Browserify transform for the istanbul code coverage tool. Isparta istrumenter for ES6
        // code coverage. TODO(floreks): try to make import work instead of require
        ['browserify-istanbul', {'instrumenter': require('isparta')}],
        // Transform ES6 code into ES5 so that browsers can digest it.
        ['babelify'],
      ],
    },

    // karma-ng-html2js-preprocessor plugin config.
    ngHtml2JsPreprocessor: {
      stripPrefix: `${conf.paths.frontendSrc}/`,
      // Load all template related stuff under ng module as it's loaded with every module.
      moduleName: 'ng',
    },
  };

  // Use custom browser configuration when running on Travis CI.
  if (process.env.TRAVIS) {
    configuration.browsers = ['chromeTravis'];
  }

  // Convert all JS code written ES6 with modules to ES5 bundles that browsers can digest.
  configuration.preprocessors[path.join(conf.paths.frontendTest, '**/*.js')] = ['browserify'];
  configuration.preprocessors[path.join(conf.paths.frontendSrc, '**/*.js')] = ['browserify'];

  // Convert HTML templates into JS files that serve code through $templateCache.
  configuration.preprocessors[path.join(conf.paths.frontendSrc, '**/*.html')] = ['ng-html2js'];

  config.set(configuration);
};
