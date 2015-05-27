module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      dyna: {
        src : ['src/main.js'],
        dest: 'dyna.js',
        options: {
          browserifyOptions: {
            standalone: 'dyna'
          },
          plugin: [ ['browserify-derequire'] ]
        }
      }
    },
    jsdoc : {
      dist : {
        src: ['src/**/*.js'],
        options: {
          destination: 'docs'
        }
      }
    }
  });

  // Load the plugin that provides the other task.
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-jsdoc');

  // Default task(s).
  grunt.registerTask('default', ['browserify', 'jsdoc']);

};