const fs = require("fs");
const xpath=require('xpath');
const dom=require('xmldom').DOMParser;
const path = require('path');
const log4js = require('log4js');

var cacheLogger = log4js.getLogger('Cache');

var BlogCache = function(cache_path) {
  this._cache_path = cache_path?cache_path:'./';
  this._cache_file = path.join(this._cache_path, 'cache.data');
  this._cache={};
  try{
    fs.accessSync(this._cache_file, fs.R_OK | fs.W_OK);
    var data = fs.readFileSync(this._cache_file);
    this._cache = JSON.parse(data);
  }
  catch(e){
    cacheLogger.error('no previous blogs');
  }
}
BlogCache.prototype.limits=100;
BlogCache.prototype.addBlog = function(publicID, blog) {
  if(!(publicID in this._cache))
    this._cache[publicID] = {"list":[], "upTime": Date.now()};
  var len = this._cache[publicID]['list'].unshift(blog);
  this._cache[publicID]['upTime'] = Date.now();
  if(len>this.limits)
    this._cache[publicID]['list'].pop();
  fs.writeFile(this._cache_file, JSON.stringify(this._cache), function(err){
    if(err){
      cacheLogger.error('write cache file fail');
    }
  });
}
BlogCache.prototype.parseBlogContent = function(publicID, Content) {
  var doc = new dom().parseFromString(
    Content.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&'));
  var items = xpath.select("//category/item", doc);
  for(var i=0; i<items.length; i++) {
    var blog = {
      "title": xpath.select("title/text()", items[i]).toString().slice(9, -3),
      "url": xpath.select("url/text()", items[i]).toString().slice(9, -3)
    }
    this.addBlog(publicID, blog);
  }

}
BlogCache.prototype.getBlogList = function(publicID) {
  if(!(publicID in this._cache))
    return {'list': [], 'upTime': 0};
  this._cache[publicID]['upTime'] = Date.now();
  return this._cache[publicID];
}
BlogCache.prototype.getBlogLists = function() {
  return this._cache;
}

module.exports = BlogCache;