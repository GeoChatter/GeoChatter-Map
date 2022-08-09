
import { show } from '$lib/Alert.svelte';

import { writable } from "svelte/store";
import {getGuessState,  startConnection, sendGuess, type Guess, type Flag, SendFlagToClients, sendColor,type Color } from "./signalR";
import { user, auth, supabase } from '$lib/supabase';
import { get } from "svelte/store";
import settings from './settings';

// TODO: REMOVE FOR SIGNALR API 

// Check if target client is online
const SERVER_GET = 'https://api.geochatter.tv/guess?botname=';

// Send guess and read guess ID
const SERVER_POST = 'https://api.geochatter.tv/guess/'; //'https://guess.geochatter.tv/api/' //

// Check guess status : 200 = processed , 100 = being processed , default = failed
const SERVER_GUESS_CHECK = 'https://api.geochatter.tv/guess?id=';

class Api {
  _bot: string | undefined;
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


  async sendGuessToBackend(lat: string, lng: string, confirmed = true, random = false) {
    // if temporary and temporaryGuessing is not enabled return early
    if (!confirmed && !settings.values.temporaryGuesses) {
      console.log("temporary guessing is not enabled")
      return
    }
    let data: Guess;
    const userStore = get(user)
    if (!userStore) return;
    // FIXME: add confirmed guess
    switch (userStore.app_metadata.provider) {
      case 'twitch':
        data = {
          bot: this.bot,
          lat: lat,
          lng: lng,
          sourcePlatform: "Twitch",
          tkn: auth.session()?.access_token,
          id: userStore.user_metadata.sub,
          name: userStore.user_metadata.name,
          display: userStore.user_metadata.slug,
          pic: userStore.user_metadata.picture,
          isTemporary: !confirmed,
          isRandom: random
        };
        break;
      case 'google':
        console.log(userStore.user_metadata);
        data = {
          bot: this.bot,
          lat: lat,
          lng: lng,
          sourcePlatform: "YouTube",
          tkn: auth.session()?.access_token,
          id: userStore.user_metadata.sub,
          name: userStore.user_metadata.full_name,
          display: userStore.user_metadata.name,
          pic: userStore.user_metadata.avatar_url,
          isTemporary: !confirmed,
          isRandom: random
        };
        break;
    }

    console.log(data);
    // loading = true;
    console.log(data)
    const [sendGuessError, sendGuessRes] = await this.sendGuess(data);

    console.log(sendGuessRes)
    
    // sleep function
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    await sleep(200)



    if (!sendGuessError) {
      let state = await getGuessState(Number(sendGuessRes))
      console.log(state)
      let counter = 50
      while (state === "Submitted" || counter <= 0){
        state = await getGuessState(Number(sendGuessRes))
        console.log(state)
        await sleep(300)
        counter = counter -1 
      }
      if (counter <= 0 ){
        state = "Client couldn't process guess"
      }
      if (state === "Success") {
        show(1, "Guess sent successfully")
      } else{
        show(1, `Error: ${state}`,true)
      }
    }

    

    if (sendGuessError) {
      console.log(sendGuessError);
      alert('some thing went wrong while sending your guess');
    }

    // if (!sendGuessError && confirmed) {
    //   show(1, random ? "Random guess sent" : 'Guess sent');
    // }
  }

  async sendFlag(flag: string) {

    const userStore = get(user)
    let data: Flag

    switch (userStore.app_metadata.provider) {
      case 'twitch':
        data = {
          bot: this.bot,
          sourcePlatform: "Twitch",
          tkn: auth.session()?.access_token,
          id: userStore.user_metadata.sub,
          name: userStore.user_metadata.name,
          display: userStore.user_metadata.slug,
          flag: flag,
          pic: userStore.user_metadata.picture,
        };
        break;
      case 'google':
        console.log(userStore.user_metadata);
        data = {
          bot: this.bot,
          sourcePlatform: "YouTube",
          tkn: auth.session()?.access_token,
          id: userStore.user_metadata.sub,
          name: userStore.user_metadata.full_name,
          display: userStore.user_metadata.name,
          pic: userStore.user_metadata.avatar_url,
      flag: flag,
        };
        break;
    }
    const res = await SendFlagToClients(data);

    return res;
  }
  async sendColor(color: string) {

    const userStore = get(user)

    let data: Color

    switch (userStore.app_metadata.provider) {
      case 'twitch':
        data = {
          bot: this.bot,
          sourcePlatform: "Twitch",
          tkn: auth.session()?.access_token,
          id: userStore.user_metadata.sub,
          name: userStore.user_metadata.name,
          display: userStore.user_metadata.slug,
          color,
          pic: userStore.user_metadata.picture,
        };
        break;
      case 'google':
        console.log(userStore.user_metadata);
        data = {
          bot: this.bot,
          sourcePlatform: "YouTube",
          tkn: auth.session()?.access_token,
          id: userStore.user_metadata.sub,
          name: userStore.user_metadata.full_name,
          display: userStore.user_metadata.name,
          pic: userStore.user_metadata.avatar_url,
          color,
        };
        break;
    }
    const res = await sendColor(data);

    return res;
  }
  // might be depreacated soon?
  // async getCurrentState() {
  //   let error: string;
  //   let res
  //   try {
  //     res = await getCurrentState(this.bot)
  //   } catch (e) {
  //     error = e;
  //   }

  //   const resObj = await res.json()
  //   const streamer = resObj?.channelName
  //   // console.log(this.streamer)

  //   return [error, res];
  // }

  // add confirmed or not or random guess?
  async sendGuess(data: Guess): Promise<([string, Response])> {
    let [error, res] = await sendGuess(data);

    return [error, res];
  }

}
const api = new Api()
export default api
