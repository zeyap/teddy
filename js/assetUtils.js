const assetUtils = {
    loadFiles: function(filesToLoad, callback){
        function handleFileComplete(){
            filesLoaded = filesToLoad.map(file=>{
                return queue.getResult(file.id)});
            callback(filesLoaded)
        }
        const queue = new createjs.LoadQueue();
        queue.on("complete",handleFileComplete)
        queue.loadManifest(filesToLoad);
    },
}
