import { writable, type Writable } from "svelte/store"
// @ts-ignore
import { browser } from "$app/env"

import { z, MapOptions } from "GCSocketClient"

const streamerSettingsKeys = MapOptions.keyof()
export class Settings {



  set: Writable<typeof this>['set'];
  subscribe: Writable<typeof this>['subscribe'];
  update: Writable<typeof this>['update'];

  makeThisWritable() {
    const P = writable(this);
    const { set, subscribe, update } = P;

    this.set = set;
    this.update = update;
    this.subscribe = subscribe;
  }

  refresh = () => {
    this.set(this);
  };
  // write you can add defaults here 
  _values = {
    _3d: true,
    sens: 100,
    ex: 1,
    globe: false,
    copyAndPaste: false,
    borderAdmin: false,
    showBorders: true,
    drawerOpen: false,
    globeView: true,
    showFlags: true,
    showStreamOverlay: true,
    temporaryGuesses: true,
    testing: false
  }

  streamerSettings = {
    showBorders: false,
    showFlags: false,
    borderAdmin: true,
    showStreamOverlay: false,
    temporaryGuesses: false,
    streamer: undefined,
    twitchChannelName: undefined
  }


  changeStreamerSettings(key: z.infer<typeof streamerSettingsKeys>, newVal) {
    if (typeof this._values[key] !== undefined) {
      this.streamerSettings[key] = newVal
      this.refresh()
    }
    else {
      console.log(
        "key not found"
      )


    }
  }

  get values() {
    // needs node 17 to work
    const values = structuredClone(this._values)
    // const values = JSON.parse(JSON.stringify(this._values))

    for (const key of Object.keys(this.streamerSettings)) {
      if (this.streamerSettings[key] === false) {
        values[key] = this.streamerSettings[key]
      }
    }
    // not sure how to refresh the store here?
    // this.refresh()
    return values
  }

  constructor() {
    this.load()
    this.makeThisWritable();
  }

  load() {
    if (browser) {
      const loadedObj = JSON.parse(localStorage.getItem("settings")) ?? {}
      for (const key of Object.keys(loadedObj)) {
        this._values[key] = loadedObj[key]
      }
    }
  }

  save() {
    if (browser) {
      localStorage.setItem("settings", JSON.stringify(this.values))
    }
  }

  change(key: keyof typeof this._values, newVal: boolean) {
    if (typeof this._values[key] !== undefined) {
      //@ts-ignore
      this._values[key] = newVal
      this.save()
      this.refresh()
    }
    else {
      console.log(
        "key not found"
      )
    }
  }
}
const settings = new Settings()
export default settings
