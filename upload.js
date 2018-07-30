'use strict';

//file.slice 不兼容
//let blobSlice = (File.prototype.mozSlice || File.prototype.webkitSlice || File.prototype.slice)

/**
 * 
 */
function buildURLQuery(obj) {
  return Object.entries(obj)
    .map(pair => pair.map(encodeURIComponent).join('='))
    .join('&');
}

/**
 * 
 * @param {*} file fileNode.files[0]
 */
async function filemd5(file) {
  var fileReader = new FileReader();// box = document.getElementById('box');
  var chunkSize = 2097152, //2M
    chunks = Math.ceil(file.size / chunkSize),
    currentChunk = 0,
    spark = new SparkMD5();

  do {
    var md5 = await new Promise((resolve) => {
      fileReader.onload = function (e) {
        spark.appendBinary(e.target.result);
        currentChunk++;
        if (currentChunk < chunks) {
          resolve(false)
        } else {
          var md5 = spark.end();
          resolve(md5)
        }
      };
      var start = currentChunk * chunkSize, end = start + chunkSize >= file.size ? file.size : start + chunkSize;
      fileReader.readAsBinaryString(file.slice(start, end));
    })
  } while (!md5)
  return md5;
}

class Upload {
  constructor(url, file, name, chunkSize = 1024*1024) {
    this.handler = {}
    this.data = {}
    this._abort = false
    this.upload(url, file, name, chunkSize)
  }

  /**
   * 
   * @param {*} url 
   * @param {*} file 
   * @param {*} name 
   * @param {*} chunkSize 
   */
  async upload(url, file, name, chunkSize = 1024*1024) {
    var start = 0
    var start = 0;
    var data;
    file.md5 = await filemd5(file);
    do {
      try {
        var data = await this.uploadFileSlice(url, file, start, name, chunkSize);
        if (this.onprogress) {
          this.onprogress(data, start)
        }
      } catch (data) {
        console.log('slice upload failed', data)
        if (this.onfail) {
          this.onfail(data)
        }
        break
      }
      if (this._abort) {
        break;
      }
    } while (!this._abort && data['next_start'] > start && data['next_start'] < file.size && (start = data.next_start));
    if (this.onsuccess) {
      this.onsuccess(data)
    }
  }
  abort(abort = true) {
    this._abort = abort;
    return this
  }
  success(func) {
    this.onsuccess = func
    return this
  }
  progress(func) {
    this.onprogress = func
    return this
  }
  fail(func) {
    this.onfail = func
    return this
  }
  /**
   * 
   * @param {*} file 
   * @param {*} start 
   * @param {*} name 
   * @param {*} chunkSize 
   */
  uploadFileSlice(url, file, start, name, chunkSize = 1024 * 1024) {
    return new Promise((resolve, reject) => {
      var fd = new FormData();
      var res;
      var xhr = new XMLHttpRequest();
      var blobFile = file.slice(start, start + chunkSize);
      const data = {
        "start": start,
        "size": file.size,
        "md5": file.md5,
        "name": name || file.name,
      }
      // fd.append("chunk", new File([blobFile], name||file.name));
      fd.append("chunk", blobFile);
      if (!url.includes('?')) {
        url += '?'
      }
      url += '&' + buildURLQuery(data)

      if (1) {
        fetch(url, {
          credentials: "include",
          method: 'POST',
          headers: {
            'X-requested-with': 'XMLHttpRequest',
            "Accept": "application/json",
          },
          body: fd,
        }).then(r => resolve(r.json())).catch(r => reject(r.json()))
      }

    });
  }
}
const { global_var } = { global_var: 'abcdef' }