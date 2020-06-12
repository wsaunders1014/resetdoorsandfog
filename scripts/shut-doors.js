async function resetFogFromUnactivatedScene(scene){
	console.log(scene.data._id)
    const response = await SocketInterface.dispatch("modifyDocument", {
      type: "FogExploration",
      action: "delete",
      data: {scene: scene.data._id},
      options: {reset: true}
    });
    return this._onResetFogFromUnactivatedScene(response.result);

}
async function _onResetFogFromUnactivatedScene(resetData) {
	console.log(resetData)
	if(resetData.scene == canvas.scene.data._id){
		
		canvas.sight._fogUpdated = false;
		canvas.draw();
	}else{

	}
    // ui.notifications.info(`Fog of War exploration progress was reset for this Scene`);
    // this._fogUpdated = false;
    // canvas.draw();
  }
//Credit to Everybody Look Here for code to add to Scene Nav
function getContextOption2(idField) {
    return {
        name: "Reset Doors & Fog",
        icon: '<i class="fas fa-dungeon"></i>',
        condition: li => game.user.isGM,
        callback: li => {
            let scene = game.scenes.get(li.data(idField));      
           
            resetDoorsAndFog(scene)
           
            //resetFogFromUnactivatedScene(scene);
        }
    };
}
async function resetDoorsAndFog(scene){
	let isCurrentScene = scene.data._id == canvas.scene.data._id;
	await resetDoors(isCurrentScene,scene.data._id);
	await resetFog(isCurrentScene,scene.data._id);
}
async function resetDoors(isCurrentScene,id=null){
	if(isCurrentScene){
		await canvas.walls.doors.forEach((item)=> item.update({ds:0}));
	}else{
		console.log(game.scenes.get(id).data.walls.filter((item)=> item.door != 0))
		await game.scenes.get(id).data.walls.filter((item)=> item.door != 0).forEach((x) => x.ds = 0);
	}
}
async function resetFog(isCurrentScene,id=null){
	if(isCurrentScene){
		canvas.sight.resetFog();
	}else{
		 const response = await SocketInterface.dispatch("modifyDocument", {
	      type: "FogExploration",
	      action: "delete",
	      data: {scene:id},
	      options: {reset: true}
	    });
	}
}
//Adds menu option to Scene Nav and Directory
Hooks.on("getSceneNavigationContext", (html, contextOptions) => {
    contextOptions.push(getContextOption2('sceneId'));
});

Hooks.on("getSceneDirectoryEntryContext", (html, contextOptions) => {
    contextOptions.push(getContextOption2('entityId'));
});

//Adds Shut All Doors button to Walls Control Layer
Hooks.on("getSceneControlButtons", function(controls){
		
	controls[4].tools.push({
      name: "close",
      title: "Close All Doors",
      icon: "fas fa-door-closed",
      onClick: () => {
      	
			resetDoors(true);
		
	  },
      button: true
    })
    return controls;
	
})

