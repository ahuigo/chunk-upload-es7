# upload-chunk

    import Upload from './upload.js'
    var tmpBlob = new File(['hello'], 'a.png', {type:'image/png'});

    filename = 'test.png'
    chunkSize = 1024*1024; //1M
    new Upload('/api/clipboard/uploadFile', tmpBlob, filename, chunkSize).success(d=>console.info(d)).fail(d=>console.error(d))
