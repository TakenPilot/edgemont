var gulp = require('gulp'),
  hbs = require('gulp-static-handlebars'),
  aside = require('gulp-aside'),
  cssmin = require('gulp-cssmin'),
  rename = require('gulp-rename'),
  data = require('./data.json');

/**
 * Pull data from source and save it to new-data.json
 */
gulp.task('pull', function () {

});

/**
 * Successful if new-data.json is different than data.json
 */
gulp.task('compare', function() {

});

/**
 * Copy new-data.json to data.json
 */
gulp.task('accept', function () {

});

/**
 * Build site using data.json, put new site into dist
 */
gulp.task('build', function () {
  gulp.src('src/*')
    .pipe(aside('**/*.hbs', hbs(data)))
    .pipe(aside('**/*.hbs', rename({extname:'.html'})))
    .pipe(aside('**/*.css', cssmin()))
    .pipe(gulp.dest('dist'));
});

/**
 * Serve dist, whatever state
 */
gulp.task('serve', function () {

});

