module.exports = {
    itemswitch(itemType){
        switch (itemType) { //Itemtype switch
            case "1": //Magic Hood
                itemType = "5a26757b2c598716c06e90e4";
                break;
            case "2": //Mystic Compass
                itemType = "5a26778e2c598716c06e90e5";
                break;
            default:
                itemType = "-1";
                break;
        }
        return itemType;
    }
}