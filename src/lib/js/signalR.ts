import * as signalR from '@microsoft/signalr';


const connection = new signalR.HubConnectionBuilder().withUrl("https://dev.geochatter.tv/guess/geoChatterHub", {}).build();




const listenToMapFeatures = () => connection.on("SetMapFeatures", function (options) {
    console.log(options)
});


export const startConnection = async (botName: string) => {

    // start the connection and login to client
    try {
        const startRes = await connection.start()
        console.log("connection started")
        const res = await connection.invoke("MapLogin", botName)
        console.log("logged in to map", res)
        listenToMapFeatures()
        console.log("listening to map features")
    }
    catch (err) {
        console.log(err)
        return err
    }


}

export const getCurrentState = async (botName: string) => {
    return await connection.invoke("GetClientState", botName)
}

export type Guess = {
    bot: string;
    lat: string;
    lng: string;
    tkn: string;
    id: string;
    name: string;
    display: string;
    pic: string;
    isTemporary: boolean;
    isRandom: boolean;
};

export const sendGuess = async (guess: Guess) => {
    try {
        await connection.invoke("SendGuessToClients", guess)
    }
    catch (err) {
        console.log(err)
        return err
    }
}





export const senfFlagToClients = async (data) => {
    try {
        const res = await connection.invoke("SendFlagToClients", data)

        console.log(res)
    } catch (err) {
        console.log(err)
        return err
    }
}



