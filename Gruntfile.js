'use strict';

module.exports = function (grunt) {
  // init config
  grunt.initConfig({
    // default package
    pkg       : grunt.file.readJSON('package.json'),
    // hint our app
    yoctohint : {
      options  : {},
      all      : [ 'src/***', 'Gruntfile.js' ]
    },
    // Uglify our app
    uglify    : {
      options : {
        banner  : '/* <%= pkg.name %> - <%= pkg.description %> - V<%= pkg.version %> */\n'
      },
      api     : {
        files : [ {
          expand  : true,
          cwd     : 'src',
          src     : '**/*.js',
          dest    : 'dist'
        } ]
      }
    },
    // unit testing
    mochaTest : {
      // Test all unit test
      all  : {
        options : {
          reporter : 'spec',
        },
        src     : [ 'test/*.js' ]
      }
    }
  });

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('yocto-hint');

  grunt.registerTask('hint', 'yoctohint');
  grunt.registerTask('test', 'mochaTest');
  grunt.registerTask('build', [ 'hint', 'test', 'uglify' ]);
  grunt.registerTask('default', 'build');
};
