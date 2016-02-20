var gulp = require('gulp');
var dest = require('gulp-dest');
var ts = require('gulp-typescript');

gulp.task('default', function () {
	return gulp.src('./app/scripts/**/*.ts')
		.pipe(ts({
			noImplicitAny: true,
			out: 'app.js'
		}))
		.pipe(gulp.dest('./app/scripts'));
});
