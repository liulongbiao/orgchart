module.exports = function(grunt) {
	grunt.initConfig({
		concat: {
			dist: {
				src: ['src/raphael.orgbox.js', 'src/jquery.widgets.orgchart.js'],
				dest: 'dist/jquery.widgets.orgchart.all.js'
			}
		},
		min: {
			dist: {
				src: ['<config:concat.dist.dest>'],
				dest: 'dist/jquery.widgets.orgchart.all.min.js'
			}
		},
		lint: {
			files: ['grunt.js', 'src/**/*.js']
		},
		jshint: {
			options: {
				newcap : false
			}
		}
	});
	grunt.registerTask('default', 'lint concat min');
};