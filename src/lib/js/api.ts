
import { show } from '$lib/Alert.svelte';

import { user, auth, supabase } from '$lib/supabase';
import { get } from "svelte/store";
import settings from './settings';

import { GCSocketClient, z, Guess, Flag, Color, MapOptions } from 'GCSocketClient';
import { downloadAndUnzipFlags, flagsLoaded, removeFlagPack } from './helpers/getFeature';

let old_flag_packs: Set<string> = new Set()
let new_flag_packs: Set<string> = new Set()
const setStreamerSettings = async (options: z.infer<typeof MapOptions>) => {

  const names = await (await fetch("https://service.geochatter.tv/flagpacks/names.json")).json()
  Object.entries(options).forEach(([key, value]) => {
    // FIXME: don"t replace show any more keep streamer settings in sync with streamer settings from server
    if (key === "isUSStreak") {
      settings.change("borderAdmin", false)
    }
    // installing flag packs 
    try {
      const installedFlagPack = JSON.parse(options.installedFlagPacks)

      old_flag_packs = new_flag_packs
      new_flag_packs = new Set()
      for (const code of installedFlagPack ) {
        if (typeof code === "string") {

          const [key, _ ] = Object.entries(names.packs).find(([_,value]) => value === code)
          const url = "https://service.geochatter.tv/flagpacks/" + key + ".zip"
          new_flag_packs.add(url)
          if(!old_flag_packs.has(url)) {
             downloadAndUnzipFlags(url)
          }
        }
      }
   /* Removing flag packs that are not in the new flag pack list. */
     Array.from(old_flag_packs).forEach(url => {
        if (!new_flag_packs.has(url)) {
           removeFlagPack(url)
        }
      })
    }
    catch (e) {
      console.log(e)

    }
    
    const parseResponse = MapOptions.keyof().safeParse(key)
    if (parseResponse.success) {
      settings.changeStreamerSettings(parseResponse.data, value)
    }
  })
}
class Api {
  _bot: string | undefined;
  client: GCSocketClient
  constructor(bot: string) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    console.log(import.meta.VITE_GEOCHATTERURL)
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

    this.client.sendGuess(data, !random)


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
