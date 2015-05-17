'use strict';

var gulp = require('gulp'),
  gutil = require('gulp-util'),
  _ = require('lodash'),
  Promise = require('bluebird'),
  hbs = require('gulp-static-handlebars'),
  aside = require('gulp-aside'),
  cssmin = require('gulp-cssmin'),
  rename = require('gulp-rename'),
  nodemon = require('gulp-nodemon'),
  sass = require('gulp-sass'),
  flickr = require('./flickr'),
  pkg = require('./package.json'),
  googleSpreadsheet = require('./googleSpreadsheet'),
  fs = Promise.promisifyAll(require('fs')),
  isNewData = false,
  dataSources = {
    details: googleSpreadsheet.getListByProperty.bind(googleSpreadsheet, pkg.config.detail, 'name'),
    singleMenu: googleSpreadsheet.getList.bind(googleSpreadsheet, pkg.config.singleMenu),
    groupMenu: googleSpreadsheet.getList.bind(googleSpreadsheet, pkg.config.groupMenu),
    photos: flickr.getPhotoList.bind(flickr, pkg.config.flickr.userId)
  };

/**
 * Pull each data source.
 */
function pull() {
  return Promise.props(_.mapValues(dataSources, function (fn) { return fn(); }))
    .then(function (obj) {
      return fs.writeFileAsync('new-data.json', JSON.stringify(obj)).return(obj);
    });
}

/**
 * Gets more specific information.
 * @param newData
 * @param oldData
 * @returns {*}
 */
function fetch(newData, oldData) {
  return flickr.getPhotosFromList(pkg.config.flickr.userId, newData.photos, 'dist/images');
}

function accept() {
  return fs.readFileAsync('new-data.json', {encoding: 'UTF8'}).then(function (data) {
    return fs.writeFileAsync('data.json', data);
  });
}

/**
 * Successful if new-data.json is different than data.json
 */
gulp.task('update', function() {
  return pull().then(function (newData) {
    return fs.readFileAsync('data.json', {encoding: 'UTF8'}).then(function (oldData) {
      if (!_.isEqual(newData, oldData)) {
        return fetch(newData, oldData).then(function () {
          return accept();
        });
      }
    });
  });
});

/**
 * Build site using data.json, put new site into dist
 */
gulp.task('build', function () {
  gulp.src('src/*')
    .pipe(aside('**/*.hbs', hbs(fs.readFileAsync('data.json', {encoding: 'UTF8'}).then(JSON.parse))))
    .pipe(aside('**/*.hbs', rename({extname:'.html'})))
    .pipe(aside('**/*.scss', sass()))
    .pipe(aside('**/*.css', cssmin()))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', function () {
  gulp.watch('src/*', ['build']);
});

/**
 * Serve dist, whatever state
 */
gulp.task('serve', ['watch'], function () {
  return nodemon({ script: 'app.js', ext: 'html js css hbs', ignore: ['./dist/**', './node_modules/**'] })
  //.on('change', ['lint'])
  .on('restart', function () {
    console.log('restarted!');
  });
});
