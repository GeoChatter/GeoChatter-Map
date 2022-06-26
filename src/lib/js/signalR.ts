import * as signalR from '@microsoft/signalr';


const connection = new signalR.HubConnectionBuilder().withUrl("https://dev.geochatter.tv/guess/geoChatterHub").build();




const listenToMapFeatures = () => connection.on("SetMapFeatures", function (ShowStreamOverlay, ShowFlags, ShowBorders) {
    console.log(ShowStreamOverlay, ShowFlags, ShowBorders)

});


export const startConnection = async (botName: string) => {

    // start the connection and login to client
    try {
        const startRes = await connection.start()
        console.log("connection started")
        await connection.invoke("MapLogin", botName)
        console.log("connected to client")
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

export const sendGuess = async (botName: string, guess: unknown) => {
    try {
        await connection.invoke("SendGuessToClients", botName, guess)
    }
    catch (err) {
        console.log(err)
        return err
    }
}





export const senfFlagToClients = async (botName: string, flag: string, userId: string) => {
    try {
        const res = await connection.invoke("SendFlagToClients", botName, userId, flag)
        console.log(res)
    } catch (err) {
        console.log(err)
        return err
    }
}



