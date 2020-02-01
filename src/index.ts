import { ensurePermission } from './permissions-checker';
var DEFAULT_COUNT = 100;
var PRE_PAGE = 50
/**
 * Loads the most recent items from the Camera Roll
 */
function load(options) {
    if (!window.galleryAPI) {
        throw new Error('Gallery API is not available. Add https://github.com/SuryaL/cordova-gallery-api.git to your config.xml.');
    }
    // 單頁數量
    var count = (options.count) ? options.count : DEFAULT_COUNT
    // 分頁頁數
    var page = (options.page) ? options.page : 1
    return ensurePermission('get-album')
        .then(function () { return getAlbums(); })
        .then(function (albums) {
            var album = _findCameraRollAlbum(albums);
            return getMedia(album);
        })
        .then(function (items) {
            console.log('--> 搜索到的圖片張數: ' + items.length)

            console.log('--> 本次取得的筆數資料 [' + (PRE_PAGE * (page - 1) + ']->[' + (PRE_PAGE * (page)) + ']'))

            // Limit number of items for which the data is looked up (because
            // it's expensive)
            var limitedItems = items.slice((PRE_PAGE * (page - 1)), (PRE_PAGE * page));

            // Enrich items with their thumbnail
            var promises = limitedItems.map(function (_item, _index) {
                console.log('--> 圖片處理進度: ' + _index + '/' + count);
                return getMediaThumbnail(_item)
            });

            console.log('==> promises:')
            console.log(promises)

            return Promise.all(promises);
        });
}
/**
 * Finds in the list of available albums the one pointing to the device camera:
 * - iOS: type is "PHAssetCollectionSubtypeSmartAlbumUserLibrary"
 * - Android: title is "Camera"
 * @param albums List of all available albums
 * @return Album representing the Camera Roll
 */
function _findCameraRollAlbum(albums) {
    var isCameraRollAlbum = albums.find(function (album) { return album.type === 'PHAssetCollectionSubtypeSmartAlbumUserLibrary'; });
    if (isCameraRollAlbum) {
        return isCameraRollAlbum;
    }
    var androidCameraRollAlbum = albums.find(function (album) { return album.title === 'Camera'; });
    if (androidCameraRollAlbum) {
        return androidCameraRollAlbum;
    }
    throw new Error("Can't find Camera Roll album. Available albums: " + JSON.stringify(albums));
}
function getAlbums() {
    return new Promise(function (resolve, reject) {
        window.galleryAPI.getAlbums(function (albums) { return resolve(albums); }, function (e) { return reject("Failed to get albums: " + e); });
    });
}
function getMedia(album) {
    return new Promise(function (resolve, reject) {
        window.galleryAPI.getMedia(album, function (items) { return resolve(items); }, function (e) { return reject("Failed to load items for album " + album.id + ": " + e); });
    });
}
function getMediaThumbnail(item) {
    return new Promise(function (resolve, reject) {
        window.galleryAPI.getMediaThumbnail(item, function (enrichedItem) { return resolve(enrichedItem); }, function (e) { return reject("Failed to load thumbnail for item " + item.id + ": " + e); });
    });
}
/**
 * Gets the filepath to the high quality version of the mediaitem
 * @param  {Object} item Media item for which the HQ version should be looked up
 * @return Path to the HQ version of the mediaitem
 */
function getHQImageData(item) {
    return new Promise(function (resolve, reject) {
        window.galleryAPI.getHQImageData(item, function (hqFilePath) { return resolve("file://" + hqFilePath); }, function (e) { return reject("Failed to load HQ image data for item " + item.id + ": " + e); });
    });
}
/**
 * Resolve the fileEntry for a path
 * @param filePath Path
 * @return Resolved fileEntry
 */
function resolveLocalFileSystemURL(filePath) {
    return new Promise(function (resolve, reject) {
        window.resolveLocalFileSystemURL(filePath, function (fileEntry) { return resolve(fileEntry); }, function (e) { return reject("Failed to resolve URL for path " + filePath + ": " + JSON.stringify(e)); });
    });
}
/**
 * Gets a reference to a local file
 * @param filePath Path of the to be loaded file
 * @return reference to a local file
 */
function getFile(filePath) {
    return resolveLocalFileSystemURL(filePath)
        .then(function (fileEntry) { return enrichFile(fileEntry); });
}
/**
 * Enriches the file entry with size and type by resolving the file entry
 * @param fileEntry File entry to be resolved
 * @return File entry with the size and type field
 */
function enrichFile(fileEntry) {
    return new Promise(function (resolve, reject) {
        fileEntry.file(function (file) {
            fileEntry.name = file.name;
            fileEntry.size = file.size;
            fileEntry.type = file.type;
            resolve(fileEntry);
        }, function (e) { return reject("Failed to resolve file entry " + fileEntry + ": " + JSON.stringify(e)); });
    });
}
/**
 * Checks if all required libaries are available to load galley items. Use this
 * check to verify if the app runs in a Cordova environment.
 *
 * @return True if items can be loaded from the gallery
 */
function isSupported() {
    return Boolean(window.galleryAPI);
}
export {
    load, getHQImageData, getFile, isSupported,
    // Visible for testing
    _findCameraRollAlbum,
};
//# sourceMappingURL=index.js.map
