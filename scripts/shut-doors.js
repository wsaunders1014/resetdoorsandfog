/**
 * These hooks register the following settings in the module settings.
 */
Hooks.once('init', () => {

  game.settings.register('ResetDoorsAndFog', 'forceDoorIcons', {
    name: "reset-doors.force-doors-s",
    hint: "reset-doors.force-doors-l",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
    onChange: x => window.location.reload()
  });

});

//Overwrite Activate call to prevent doors from going invisible.
WallsLayer.prototype.activate = function(){
	console.log('Settings:',game.settings.get('ResetDoorsAndFog','forceDoorIcons'))
	
  PlaceablesLayer.prototype.activate.call(this)
  //Force Show Doors is set to True
  if(game.settings.get('ResetDoorsAndFog','forceDoorIcons')===false){
  	if (canvas.controls) canvas.controls.doors.visible = false;

  }
   
}

//Just a parent function for both sub functions. Kept functionality separate in case I want to detangle them later.
async function resetDoorsAndFog(scene){
	let isCurrentScene = scene.data._id == canvas.scene.data._id;
	await resetDoors(isCurrentScene,scene.data._id);
	await resetFog(isCurrentScene,scene.data._id);
}
/******** RESET DOOR **************
**********************************/
async function resetDoors(isCurrentScene,id=null){
	if(isCurrentScene){
		await canvas.walls.doors.forEach((item)=> item.update({ds:0}));
	}else{
		console.log(game.scenes.get(id).data.walls.filter((item)=> item.door != 0))
		await game.scenes.get(id).data.walls.filter((item)=> item.door != 0).forEach((x) => x.ds = 0);
	}
	ui.notifications.info(`Doors have been shut.`);
}
/******** RESET FOG **************
**********************************/
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
		ui.notifications.info(`Fog of War exploration progress was reset.`);
	}
	
}
//Credit to Winks' Everybody Look Here for the code to add menu option to Scene Nav
function getContextOption2(idField) {
    return {
        name: "Reset Doors & Fog",
        icon: '<i class="fas fa-dungeon"></i>',
        condition: li => game.user.isGM,
        callback: li => {
            let scene = game.scenes.get(li.data(idField));      
            resetDoorsAndFog(scene)
        }
    };
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
		
	controls[4].tools.splice(controls[4].tools.length-2,0,{
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

Hooks.on('ready', function(){
  if(game.settings.get('ResetDoorsAndFog','forceDoorIcons')===true){
  	/**
   	* Override foundry's ControlsLayer.drawDoors function in order to prevent Door Controls from being deleted.
 	*/
	ControlsLayer.prototype.drawDoors = function() {
	    console.log('my drawDoors')
	    // Create the container
	    if ( this.doors ) {
	      this.doors.destroy({children: true});
	      this.doors = null;
	    }
	    const doors = new PIXI.Container();

	    // Iterate over all walls, selecting the doors
	    for ( let w of canvas.walls.placeables ) {
	      if ( w.data.door === CONST.WALL_DOOR_TYPES.NONE ) continue;
	      if ( (w.data.door === CONST.WALL_DOOR_TYPES.SECRET) && !game.user.isGM ) continue;
	      let dc = doors.addChild(new DoorControl(w));
	      //dc.visible = false; // Start door controls as initially not visible and reveal them later
	      dc.draw();
	    }
	    this.doors = this.addChild(doors);

	    // Toggle visibility for the set of door control icons
	   // this.doors.visible = !canvas.walls._active;
	  }
	}

})

