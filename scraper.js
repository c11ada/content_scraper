const fs = require("fs");

const checkFolder = () => {

    if(fs.existsSync('./data')) {
        // Folder is here
        return
        true
    } else {
        // Folder is not here
        try {
            fs.mkdirSync('./data');
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }
}

if(checkFolder){
    console.log("folder is here");
} else {
    console.log("folder not here");
}