

import { show } from '$lib/Alert.svelte';

import { writable } from "svelte/store";
import { getCurrentState, startConnection, sendGuess, type Guess, type Flag, SendFlagToClients, sendColor } from "./signalR";
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

    if (sendGuessError) {
      console.log(sendGuessError);
      alert('some thing went wrong while sending your guess');
    }

    if (!sendGuessError && confirmed) {
      show(1, random ? "random guess send" : 'guess send');
    }
  }

  async sendFlag(flag: string) {

    const userStore = get(user)
    const data = {
      bot: this._bot,
      tkn: auth.session()?.access_token,
      id: userStore.user_metadata.sub,
      name: userStore.user_metadata.full_name,
      display: userStore.user_metadata.name,
      pic: userStore.user_metadata.avatar_url,
      flag: flag,
    };
    const res = await SendFlagToClients(data);

    return res;
  }
  async sendColor(color: string) {

    const userStore = get(user)
    const data = {
      bot: this._bot,
      tkn: auth.session()?.access_token,
      id: userStore.user_metadata.sub,
      name: userStore.user_metadata.full_name,
      display: userStore.user_metadata.name,
      pic: userStore.user_metadata.avatar_url,
      color: color,
    };
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
    let error: string;
    let res: any;
    try {
      res = await sendGuess(data);
      console.log(res)
    } catch (e) {
      error = e;
    }

    return [error, res];
  }

}
const api = new Api()
export default api