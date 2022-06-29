import { writable, type Writable } from "svelte/store"
// @ts-ignore
import { browser } from "$app/env"

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
  values = {
    _3d: true,
    sens: 100,
    ex: 1,
    globe: false,
    copyAndPaste: false,
    borderAdmin: false,
    borders: true,
    drawerOpen: false,
    globeView: true
  }

  constructor() {
    this.load()
    this.makeThisWritable();
    console.log(this.values)
  }

  load() {
    if (browser) {
      let loadedObj = JSON.parse(localStorage.getItem("settings")) ?? {}
      for (const key of Object.keys(loadedObj)) {
        this.values[key] = loadedObj[key]
      }
    }
  }

  save() {
    if (browser) {
      localStorage.setItem("settings", JSON.stringify(this.values))
    }
  }
  change(key: string, newVal) {
    if (typeof this.values[key] !== undefined) {
      this.values[key] = newVal
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
