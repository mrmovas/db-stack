
import { getCommmand } from "./utils/getCommand";

const main = async (): Promise<void> => {
    const getCommandResult = getCommmand();
    if(!getCommandResult.success) {
        if(getCommandResult.error) console.error(getCommandResult.error)
        process.exit(1);
    }

    const { direction, action } = getCommandResult;


}

main();