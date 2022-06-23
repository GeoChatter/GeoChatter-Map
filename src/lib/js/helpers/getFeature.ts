
import convert3to2alpha from '../../../variables/convertIso';
import JSZip from "jszip";
import { dev } from "$app/env"

import { borders, bordersAdmin } from '$lib/Drawer.svelte';
import { get } from "svelte/store"

import pointsWithinPolygon from "@turf/points-within-polygon"
import { point, type Feature, type FeatureCollection } from "@turf/helpers"
const BORDER_URL = 'https://service.geochatter.tv/resources/borders/content.zip'
const FLAGS_URL = 'https://service.geochatter.tv/resources/flags/content.zip'
// const BORDER_URL = dev ? "/content.zip" : "/testing_map/content.zip"

// const FLAGS_URL = dev ? "/contentFlags.zip" : "/testing_map/contentFlags.zip"


async function downloadAndUnzip() {
  const result_borders: FeatureCollection[] = []
  try {
    const response = await fetch(BORDER_URL, { cache: "no-cache" })
    const blob = await response.blob();
    const loadedZip = await JSZip.loadAsync(blob)

    for (const countryFile of Object.values(loadedZip.files)) {
      try {
        (async () => {
          const content = await countryFile.async("string")
          const json = JSON.parse(content)
          result_borders.push(json)
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


  return result_borders
}


async function downloadAndUnzipFlags() {
  const svgs = {}
  try {
    const response = await fetch(FLAGS_URL, { cache: "no-cache" })
    const blob = await response.blob();
    const loadedZip = await JSZip.loadAsync(blob)

    for (const countryFile of Object.values(loadedZip.files)) {
      try {

        const content = await countryFile.async("string")
        svgs[countryFile.name.replace(".svg", "").replace("flags/", "")] = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(content)))
      }
      catch (e) {
        console.log(e)
      }

    }
  }
  catch (e) {
    console.log(e)
  }



  // let zipFile = new ZipFile(BORDER_URL)
  // return result_borders
  return svgs
}

let svgs = downloadAndUnzipFlags()

let bordersFeatureCollections = downloadAndUnzip()
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
  if (get(bordersAdmin)) return group
  switch (group) {
    case "US": {
      const isoExists = await alpha3to2(feat.properties.shapeISO)
      console.log(isoExists)
      if (await isoExists) return isoExists
      let iso = feat.properties.shapeISO.replace("-", "")
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
  return isoObj.find(country => country.Alpha2 === iso)?.name
}

export const getCountry = async (lat: number, lng: number) => {
  if (!get(borders)) return [undefined, undefined, undefined]
  if (!bordersFeatureCollections) return
  // api.getCountry(lat, lng)
  // geometries[country]?.feature?.geometry
  const [flags, allBorders, downloadISO] = await Promise.all([svgs, bordersFeatureCollections, isos])
  for (const borders of allBorders) {
    // console.log(borders)
    for (const feature of borders.features) {
      let contains: FeatureCollection
      if (feature?.geometry) {
        contains = pointsWithinPolygon(point([lng, lat]), feature)
      }
      if (contains.features.length > 0) {
        const flagIso = await getFlagName(feature)
        const svg = flags[flagIso]
        const countryName = await getCountryNameByISO(flagIso)
        if (get(bordersAdmin)) return [borders, svg, countryName]
        else return [feature, svg, countryName]
      }
    }
  }
  return [undefined, undefined, undefined]
}
