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
  },
  photoProperty = 'url_z';

function mkdirSync(path) {
  try {
    fs.mkdirSync(path);
  } catch(e) {
    if ( e.code != 'EEXIST' ) throw e;
  }
}

function getPhotosFromList(userId, photos, dist) {
  return Promise.resolve(photos).get('photo').map(function(photo) {
    var parsedUrl = url.parse(photo.url_z),
    promise = Promise.defer();

    mkdirSync(dist);

    http.get({
      host: parsedUrl.host,
      port: 80,
      path: parsedUrl.pathname
    }, function (res) {

      var file = fs.createWriteStream([dist, photo.farmName].join(path.sep));
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
}

function getPhotoList(userId) {
  return Flickr.tokenOnlyAsync(flickrOptions).then(function(flickr) {
    var getPublicPhotos = Promise.promisify(flickr.people.getPublicPhotos);
    return getPublicPhotos({
      user_id: userId,
      page: 1,
      per_page: 20,
      extras: photoProperty
    });
  }).get('photos').then(function (photos) {
    return Promise.all(photos.photo).map(function (photo) {

      var farmFileName = photo[photoProperty];
      if (farmFileName) {
        photo.farmName = farmFileName.split('/').pop();
      } else {
        throw new Error('missing farm reference for ' + JSON.stringify(photo));
      }

    }).return(photos);
  });
}

module.exports.getPhotosFromList = getPhotosFromList;
module.exports.getPhotoList = getPhotoList;
