/*jshint -W079*/
/*jscs:disable requireCamelCaseOrUpperCaseIdentifiers*/

var Promise = require('bluebird'),
  _ = require('lodash'),
  path = require('path'),
  fs = require('fs'),
  url = require('url'),
  http = require('http'),
  Flickr = Promise.promisifyAll(require('flickrapi')),
  flickrOptions = {
    api_key: process.env.FLICKR_API_KEY,
    secret: process.env.FLICKR_SECRET
  };

module.exports.getPhotosFromList = function (userId, photos, dist) {
  return Flickr.tokenOnlyAsync(flickrOptions).then(function(flickr) {

    console.log('flickr.options', require('util').inspect(
      _.omit(flickr.options, ['api_key', 'secret']), true, 5)
    );
    console.log('photos', require('util').inspect(photos, true, 1));

    return photos;
  }).get('photo').map(function(photo) {
    console.log('photo', require('util').inspect(photo, true, 5));

    var parsedUrl = url.parse(photo.url_z),
    promise = Promise.defer();

    http.get({
      host: parsedUrl.host,
      port: 80,
      path: parsedUrl.pathname
    }, function (res) {

      var file = fs.createWriteStream([dist, photo.title].join(path.sep));
      res.on('data', function(data) {
          file.write(data);
        }).on('end', function() {
          file.end();
          promise.resolve(photo);
        });

    }).on('error', function (err) {
      promise.reject(err);
    });

    return promise;
  });
};

module.exports.getPhotoList = function(userId) {
  return Flickr.tokenOnlyAsync(flickrOptions).then(function(flickr) {

    console.log('flickr.options', require('util').inspect(
      _.omit(flickr.options, ['api_key', 'secret']), true, 5)
    );

    var getPublicPhotos = Promise.promisify(flickr.people.getPublicPhotos);

    return getPublicPhotos({
      user_id: userId,
      page: 1,
      per_page: 5,
      extras: 'url_z'
    });
  }).get('photos').catch(function(err) {
    console.error(err);
  });
};
