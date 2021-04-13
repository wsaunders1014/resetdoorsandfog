
/******************************************************************************************


RESET DOORS AND FOG BUTTONS


 ******************************************************************************************/

export const MODULE_NAME = 'resetdoorsandfog';

/**
 * Because typescript doesn't know when in the lifecycle of foundry your code runs, we have to assume that the
 * canvas is potentially not yet initialized, so it's typed as declare let canvas: Canvas | {ready: false}.
 * That's why you get errors when you try to access properties on canvas other than ready.
 * In order to get around that, you need to type guard canvas.
 * Also be aware that this will become even more important in 0.8.x because no canvas mode is being introduced there.
 * So you will need to deal with the fact that there might not be an initialized canvas at any point in time.
 * @returns
 */
export function getCanvas(): Canvas {
	if (!(canvas instanceof Canvas) || !canvas.ready) {
		throw new Error("Canvas Is Not Initialized");
	}
	return canvas;
}

//Just a parent function for both sub functions. Kept functionality separate in case I want to detangle them later.
async function resetDoorsAndFog(scene){
    let isCurrentScene = scene.data._id == getCanvas().scene.data._id;
    await resetDoors(isCurrentScene,scene.data._id);
    await resetFog(isCurrentScene,scene.data._id);
}
/******** RESET DOOR **************/

async function resetDoors(isCurrentScene,id=null){
    if(isCurrentScene){
        await getCanvas().walls.doors.filter((item) => item.data.ds == 1).forEach((item)=> item.update({ds:0}));
    }else{
        console.log(game.scenes.get(id).data.walls.filter((item)=> item.door != 0))
        await game.scenes.get(id).data.walls.filter((item)=> item.door != 0).forEach((x) => x.ds = 0);
    }
    ui.notifications.info(`Doors have been shut.`);
}

/**********************************/

/******** RESET FOG **************/

async function resetFog(isCurrentScene,id=null){
    if(isCurrentScene){
      getCanvas().sight.resetFog();
    }else{
      //@ts-ignore
      const response = await SocketInterface.dispatch("modifyDocument", {
          type: "FogExploration",
          action: "delete",
          data: {scene:id},
          options: {reset: true},
          //parentId: "",
          //parentType: ""
      });
      ui.notifications.info(`Fog of War exploration progress was reset.`);
    }

}
/**********************************/
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

// ===============================================
// HOOKS
// ===============================================

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
        title: "Close Open Doors",
        icon: "fas fa-door-closed",
        onClick: () => {
            resetDoors(true);
        },
        button: true
    })
    return controls;

})


/*********************************************************************************/
