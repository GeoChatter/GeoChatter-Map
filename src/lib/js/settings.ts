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
  values = {}

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
