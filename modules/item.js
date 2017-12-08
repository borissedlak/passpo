var hood = "5a26757b2c598716c06e90e4";
var compass = "5a26778e2c598716c06e90e5";

module.exports = {
    itemSwitchIn(itemType) {
        switch (itemType) { //Itemtype switch
            case "1": //Magic Hood
                itemType = hood;
                break;
            case "2": //Mystic Compass
                itemType = compass;
                break;
            default:
                itemType = "-1";
        }
        return itemType;
    }
    ,
    itemSwitchOut(itemType) {
        //doest work with switch ....
        /*switch (itemType) { //Itemtype switch
            case hood: //Magic Hood
                itemType = "1";
                break;
            case compass: //Mystic Compass
                itemType = "2";
                break;
            default:
                itemType = "-1";
                break;
        }
        return itemType;*/

        if(itemType == hood){
            itemType = "1";
        }
        else if (itemType == compass){
            itemType = "2";
        }
        else{
            itemType = "-1";
        }
        return itemType;
    }
}