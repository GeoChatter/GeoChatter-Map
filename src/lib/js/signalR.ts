import * as signalR from '@microsoft/signalr';
import settings from './settings';


const connection = new signalR.HubConnectionBuilder().withUrl("https://dev.geochatter.tv/guess/geoChatterHub", {}).build();

export declare module ScoreBoard {

    export interface Player {
        id: number;
        channel: string;
        twitchId: string;
        playerName: string;
        playerFlag: string;
        playerFlagName: string;
        countryStreak: number;
        bestStreak: number;
        correctCountries: number;
        numberOfCountries: number;
        wins: number;
        perfects: number;
        overallAverage: number;
        bestGame: number;
        bestRound: number;
        sumOfGuesses: number;
        totalDistance: number;
        lastGuess: string;
        noOfGuesses: number;
        noOf5kGuesses: number;
        roundNumberOfLastGuess: number;
        displayName: string;
        profilePictureUrl: string;
        color?: any;
        isBanned: boolean;
        streakBefore: number;
        firstGuessMade: boolean;
        idOfLastGame: number;
        modified: Date;
    }

    export interface Row {
        id: number;
        guessCount: number;
        player: Player;
        distance: number;
        score: number;
        time: number;
    }

}

export const getGameSummary = async (gameId: string) => {
    const res: ScoreBoard.Row[] = await connection.invoke("GetGameSummary", gameId)

    return res

}
const setStreamerSettings = (options) =>
    Object.entries(options).forEach(([key, value]) => {

        key = key.replace("show", "")
        key = key.charAt(0).toLowerCase() + key.slice(1)
        if (key === "isusstreak") {
            key = "borderAdmin"
            value = !value
        }
        settings.changeStreamerSettings(key, value)
    })

const listenToMapFeatures = () => connection.on("SetMapFeatures", function (options) {
    setStreamerSettings(options)
});


export const startConnection = async (botName: string) => {

    // start the connection and login to client
    try {
        const startRes = await connection.start()
        console.log("connection started")
        const res = await connection.invoke("MapLogin", botName)
        if (res) {
            setStreamerSettings(res)
        }
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


export type Flag = {
    bot: string;
    tkn: string;
    id: string;
    name: string;
    display: string;
    pic: string;
    flag: string;
};


export const SendFlagToClients = async (data: Flag) => {
    try {
        const res = await connection.invoke("SendFlagToClients", data)
        return res

        console.log(res)
    } catch (err) {
        console.log(err)
        return err
    }
}


export type Color = {
    bot: string;
    tkn: string;
    id: string;
    name: string;
    display: string;
    pic: string;
    color: string;
};

export const sendColor = async (data: Color) => {
    await connection.invoke("SendColorToClients", data)
}
