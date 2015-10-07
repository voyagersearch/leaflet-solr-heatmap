var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var clean = require('gulp-clean');
var rename = require('gulp-rename');

gulp.task('dist', function() {
    return gulp.src(['canvas_layer/leaflet_canvas_layer.js', '*.js', '!Gulpfile.js'])
        .pipe(concat('heatmap.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename('heatmap.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', function() {
    return gulp.src('dist/*.js')
        .pipe(clean());
});