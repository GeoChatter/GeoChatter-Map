
import { show } from '$lib/Alert.svelte';

import { user, auth, supabase } from '$lib/supabase';
import { get } from "svelte/store";
import settings from './settings';

import { GCSocketClient, z, Guess, Flag, Color, MapOptions } from 'GCSocketClient';
import { downloadAndUnzipFlags } from './helpers/getFeature';

const setStreamerSettings = (options: z.infer<typeof MapOptions>) =>

  Object.entries(options).forEach(([key, value]) => {
    // FIXME: don"t replace show any more keep streamer settings in sync with streamer settings from server
    if (key === "isUSStreak") {
      settings.change("borderAdmin", false)
    }
    // installing flag packs 
    try {
    const installedFlagPack = JSON.parse(options.installedFlagPacks)

    for (const url of Object.values(installedFlagPack)) {
      if (typeof url === "string") {
        downloadAndUnzipFlags(url)
      }
      }
    }
    catch (e) {
      console.log("flagpacks not valid json i think")
      console.log(e)

    }
    
    const parseResponse = MapOptions.keyof().safeParse(key)
    if (parseResponse.success) {
      settings.changeStreamerSettings(parseResponse.data, value)
    }
  })
class Api {
  _bot: string | undefined;
  client: GCSocketClient
  constructor(bot: string) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.client = new GCSocketClient(import.meta.env.VITE_GEOCHATTERURL as string, bot ?? "", {
      onFailedGuess: (_, text) => {

        show(1, text, true)

      },


      onSuccessfulGuess: () => {
        show(1, "Guess sent successfully")
      }
      , onStreamerSettings: setStreamerSettings,
      onRoundStart: () => {
        console.log("round start")
      },
      onGameStart: () => {
        console.log("game start")
      },
      onRoundEnd: () => {
        console.log("round end")
      },
      onGameEnd: () => {
        console.log("game end")
      },
      
    },
    )
  }


  set bot(bot) {
    this._bot = bot
    if (bot) {
      this.client.streamerCode = bot
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
    let data: z.infer<typeof Guess>;
    const userStore = get(user)
    if (!userStore) return;
    // FIXME: add confirmed guess
    switch (userStore.user_metadata.iss) {
      case 'https://api.twitch.tv':
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
      case 'https://www.googleapis.com/userinfo/v2/me':
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
        }; Flag
    }

    this.client.sendGuess(data)


  }

  async sendFlag(flag: string) {

    const userStore = get(user)
    let data: z.infer<typeof Flag>

    switch (userStore.user_metadata.iss) {
      case 'https://api.twitch.tv':
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
      case 'https://www.googleapis.com/userinfo/v2/me':
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
    this.client.sendFlag(data)

  }
  async sendColor(color: string) {

    const userStore = get(user)

    let data: z.infer<typeof Color>

    switch (userStore.user_metadata.iss) {
      case 'https://api.twitch.tv':
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
      case 'https://www.googleapis.com/userinfo/v2/me':
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

    this.client.sendColor(data)
  }

}
const api = new Api("")
export default api
