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
  awspublish = require('gulp-awspublish'),
  awspublishRouter = require('gulp-awspublish-router'),
  parallelize = require('concurrent-transform'),
  flickr = require('./flickr'),
  pkg = require('./package.json'),
  googleSpreadsheet = require('./googleSpreadsheet'),
  fs = Promise.promisifyAll(require('fs')),
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
    }).tap(function () { console.log('finished pull'); });
}

/**
 * Gets more specific information.
 * @param newData
 * @param oldData
 * @returns {*}
 */
function fetch(newData, oldData) {
  return flickr.getPhotosFromList(pkg.config.flickr.userId, newData.photos, 'dist/images')
    .tap(function () { console.log('finished fetch'); });
}

function accept() {
  return fs.readFileAsync('new-data.json', {encoding: 'UTF8'}).then(function (data) {
    return fs.writeFileAsync('data.json', data);
  }).tap(function () { console.log('finished accept'); });
}

/**
 * @param options
 */
function publish(options) {
  // create a new publisher
  var publisher = awspublish.create({
    key: process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: options.bucket,
    region: options.region
  });

  //define custom headers
  var headers = {
    'Cache-Control': 'max-age=315360000, no-transform, public',
    'Content-Encoding': 'gzip'
  };

  return gulp.src('./dist/**/*')

    // gzip, Set Content-Encoding headers and add .gz extension
    .pipe(awspublishRouter({
      routes: {
        '(.*html)$': {
          gzip: true,
          cacheTime: 630720000, //2 years
          headers: {
            'Content-Encoding': 'gzip',
            'Content-Type': 'text/html'
          }
        },
        '(.*js)$': {
          gzip: true,
          cacheTime: 630720000, //2 years
          headers: {
            'Content-Encoding': 'gzip',
            'Content-Type': 'application/javascript'
          }
        },
        '(.*css)$': {
          gzip: true,
          cacheTime: 630720000, //2 years
          headers: {
            'Content-Encoding': 'gzip',
            'Content-Type': 'text/css'
          }
        },
        '(.*webp)$': {
          gzip: true,
          cacheTime: 630720000, //2 years
          headers: {
            'Content-Encoding': 'gzip',
            'Content-Type': 'image/webp'
          }
        },
        '(.*ttf)$': {
          gzip: true,
          cacheTime: 630720000, //2 years
          headers: {
            'Content-Encoding': 'gzip',
            'Content-Type': 'application/x-font-ttf'
          }
        },
        '^.+$': '$&'
      }
    }))

    // publisher will add Content-Length, Content-Type and  headers specified above
    // If not specified it will set x-amz-acl to public-read by default
    .pipe(parallelize(publisher.publish(headers), 10))

    .pipe(publisher.sync())

    // create a cache file to speed up consecutive uploads
    .pipe(publisher.cache())

    // print upload updates to console
    .pipe(awspublish.reporter());
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
        }).tap(function () { console.log('accepted'); });
      }
    }).tap(function () { console.log('files updated'); });
  }).tap(function () {
    console.log('finished update');
    _.defer(function () {
      process.exit(0);
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

gulp.task('deploy-production', function() {
  return publish(pkg.config.s3.production);
});

gulp.task('deploy-development', function() {
  return publish(pkg.config.s3.production);
});
