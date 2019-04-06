const gulp = require("gulp");
var webserver = require('gulp-webserver');

gulp.task('webserver', function() {
  gulp.src('/')
    .pipe(webserver({
      livereload: true,
      directoryListing: false,
      open: true,
	  fallback: 'index.html'
    }));
});

// Service Worker
gulp.task('sw', function() {
  
});


gulp.task('default', gulp.parallel("webserver"));