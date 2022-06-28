
// import fetch from 'node-fetch' // uncomment when using testing
// Failure state of the guessing process

import { writable } from "svelte/store";
import { getCurrentState, startConnection, sendGuess } from "./signalR";

// Check if target client is online
const SERVER_GET = 'https://api.geochatter.tv/guess?botname=';

// Send guess and read guess ID
const SERVER_POST = 'https://api.geochatter.tv/guess/'; //'https://guess.geochatter.tv/api/' //

// Check guess status : 200 = processed , 100 = being processed , default = failed
const SERVER_GUESS_CHECK = 'https://api.geochatter.tv/guess?id=';

export default class Api {
  _bot: string | undefined;
  streamer = writable("")
  constructor(bot?: string | undefined) {
    this.bot = bot;
    // this.isButtonEnabled = true
  }


  set bot(bot) {
    this._bot = bot
    if (this.bot) {
      startConnection(this.bot)
    }

  }
  get bot() {
    return this._bot
  }


  async getCurrentState() {
    let error: string;
    let res
    try {
      res = await getCurrentState(this.bot)
    } catch (e) {
      error = e;
    }

    const resObj = await res.json()
    const streamer = resObj?.channelName
    if (streamer) {
      this.streamer.set(resObj?.channelName)
    }
    // console.log(this.streamer)

    return [error, res];
  }

  async sendGuess(data: {
    bot: string;
    lat: string;
    lng: string;
    tkn: string;
    id: string;
    name: string;
    display: string;
    pic: string,
  }): Promise<([string, Response])> {
    let error: string;
    let res: any;
    try {
      res = await sendGuess( data);
      console.log(res)
    } catch (e) {
      error = e;
    }

    return [error, res];
  }

}
