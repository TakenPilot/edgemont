var gulp = require('gulp'),
  gutil = require('gulp-util'),
  _ = require('lodash'),
  Promise = require('bluebird'),
  hbs = require('gulp-static-handlebars'),
  aside = require('gulp-aside'),
  cssmin = require('gulp-cssmin'),
  rename = require('gulp-rename'),
  data = require('./data.json'),
  pkg = require('./package.json'),
  googleSpreadsheet = require('./googleSpreadsheet'),
  fs = Promise.promisifyAll(require('fs')),
  isNewData = false;

/**
 * Pull data from source and save it to new-data.json
 */
gulp.task('pull', function (done) {
  return Promise.join(
    googleSpreadsheet.getListByProperty(pkg.config.detail, 'name'),
    googleSpreadsheet.getList(pkg.config.singleMenu),
    googleSpreadsheet.getList(pkg.config.groupMenu)
  ).spread(function (details, singleMenu, groupMenu) {
      details = _.mapValues(details, 'value');

      details.singleMenu = singleMenu;
      details.groupMenu = groupMenu;
      return fs.writeFileAsync('new-data.json', JSON.stringify(details));
    });
});

/**
 * Successful if new-data.json is different than data.json
 */
gulp.task('compare', function() {
  return Promise.join(
    fs.readFileAsync('new-data.json'),
    fs.readFileAsync('data.json')
  ).spread(function (newData, data) {
      isNewData = !_.isEqual(newData, data);
      gutil.log('isNewData:', isNewData ? gutil.colors.green(isNewData): gutil.colors.red(isNewData));
    })
});

/**
 * Copy new-data.json to data.json
 */
gulp.task('accept', function () {
  return fs.readFileAsync('new-data.json').then(function (data) {
    return fs.writeFileAsync('data.json', data);
  });
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

