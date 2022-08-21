// @ts-ignore
import JSZip from "jszip";
import { get, writable } from 'svelte/store';

import settings from "../settings";

import pointsWithinPolygon from "@turf/points-within-polygon"
import { point, type Feature, type FeatureCollection, type GeometryCollection, type MultiPolygon, type Point } from "@turf/helpers"
const BORDER_URL = 'https://service.geochatter.tv/resources/borders/content.zip'
const FLAGS_URL = 'https://service.geochatter.tv/resources/flags/content.zip'
// const BORDER_URL = dev ? "/content.zip" : "/testing_map/content.zip"

// const FLAGS_URL = dev ? "/contentFlags.zip" : "/testing_map/contentFlags.zip"

let bordersLoaded = false
const result_borders = []
async function downloadAndUnzip() {
  // not really loaded but it like this so it doesn't get called again
  if (bordersLoaded) return
  bordersLoaded = true
  try {
    const response = await fetch(BORDER_URL, { cache: "no-cache" })
    const blob = await response.blob();
    const loadedZip = await JSZip.loadAsync(blob)

    for (const countryFile of Object.values(loadedZip.files)) {
      try {
        (async () => {
          const content = await countryFile.async("string")
          try {
            const json = JSON.parse(content)
            result_borders.push(json)

          } catch {

          }
        })()
      }
      catch (e) {
        console.log(e)
      }

    }
  }
  catch (e) {
    console.log(e)
  }


}


export const flagsLoaded = writable(false)
export const svgs = {} 

export const urls_keys = {} 
export function removeFlagPack(url: string) {
  console.log(url,urls_keys)
  urls_keys[url].forEach(key => {
    delete svgs[key]
  })
  delete urls_keys[url] 
}
export async function downloadAndUnzipFlags(flagsUrl = FLAGS_URL) {
  if (flagsUrl === FLAGS_URL && get(flagsLoaded)) return
  try {
    const response = await fetch(flagsUrl, { cache: "no-cache" })
    const blob = await response.blob();
    const loadedZip = await JSZip.loadAsync(blob)

    for (const countryFile of Object.values(loadedZip.files)) {
      try {

        const content = await countryFile.async("string")
        if (countryFile.name.toLowerCase().endsWith("svg")) {
          let key = countryFile.name.toLowerCase().replace(".svg", "").replace("flags/", "")
          if (flagsUrl !== FLAGS_URL) {
            if (!urls_keys[flagsUrl]) {
              urls_keys[flagsUrl] = []
            }
            urls_keys[flagsUrl].push(key)
          }
          svgs[key] = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(content)))
        }
      }
      catch (e) {
        console.log(e)
      }

    }
    
  }
  catch (e) {
    console.log(e)
  }
  console.log(flagsUrl, FLAGS_URL)
  if (flagsUrl === FLAGS_URL) {
    flagsLoaded.set(true)
  }
}





// download iso.json
async function downloadISO() {
  const isoData = await fetch("https://service.geochatter.tv/resources/other/iso.json")
  const isoObj = await isoData.json()

  return isoObj
}

const isos = downloadISO()

const alpha3to2 = async (iso: string) => {
  const isoObj = await isos
  return isoObj.find(country => country.Alpha3 === iso)?.Alpha2
}

async function getFlagName(feat: Feature) {
  const group = await alpha3to2(feat.properties.shapeGroup)
  if (settings.values.borderAdmin) return group
  switch (group) {
    case "US": {
      const isoExists = await alpha3to2(feat.properties.shapeISO)
      console.log(isoExists)
      if (await isoExists) return isoExists
      const iso = feat.properties.shapeISO.replace("-", "")
      console.log(iso)
      return iso
    }
    case "CA":
      return feat.properties.shapeISO;
    case "GB":
      return await alpha3to2(feat.properties.shapeISO) ?? feat.properties.shapeISO;
    default:
      return await alpha3to2(feat.properties.shapeISO) ?? group
  }

}

const getCountryNameByISO = async (iso: string) => {
  const isoObj = await isos
  return isoObj.find(country => country.Alpha2.toLowerCase() === iso.toLowerCase())?.name
}


export const getCountry = async (lat: number, lng: number) => {
  // if (!settings.values.showBorders) return [undefined, undefined, undefined]
  // api.getCountry(lat, lng)
  // geometries[country]?.feature?.geometry

  if (!bordersLoaded && settings.values.showFlags || settings.values.showBorders) {
    downloadAndUnzip()
  }
  if (!get(flagsLoaded) && settings.values.showFlags) {
    downloadAndUnzipFlags()
  }


  const [ downloadISO] = await Promise.all([ isos])
  for (const borders of result_borders) {
    // console.log(borders)
    for (const feature of borders.features) {
      let contains: FeatureCollection<Point, { [name: string]: any; }>
      if (feature?.geometry) {
        contains = pointsWithinPolygon(point([lng, lat]), feature)
      }
      if (contains.features.length > 0) {
        const flagIso = await getFlagName(feature)
        const svg = settings.values.showFlags ? svgs[flagIso.toLowerCase()] : undefined
        const countryName = await getCountryNameByISO(flagIso)
        if (settings.values.borderAdmin) return [borders, svg, countryName]
        else return [feature, svg, countryName]
      }
    }
  }
  return [undefined, undefined, undefined]
}
