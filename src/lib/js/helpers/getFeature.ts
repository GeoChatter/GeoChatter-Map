
import convert3to2alpha from '../../../variables/convertIso';
import JSZip from "jszip";
import { dev } from "$app/env"

import { borders, bordersAdmin } from '$lib/Drawer.svelte';
import { get } from "svelte/store"

import pointsWithinPolygon from "@turf/points-within-polygon"
import { point, type FeatureCollection } from "@turf/helpers"
const BORDER_URL = 'https://service.geochatter.tv/resources/borders/content.zip'
const FLAGS_URL = 'https://service.geochatter.tv/resources/flags/content.zip'
// const BORDER_URL = dev ? "/content.zip" : "/testing_map/content.zip"

// const FLAGS_URL = dev ? "/contentFlags.zip" : "/testing_map/contentFlags.zip"

async function downloadAndUnzip() {
  const result_borders: FeatureCollection[] = []
  try {
    const response = await fetch(BORDER_URL)
    const blob = await response.blob();
    const loadedZip = await JSZip.loadAsync(blob)

    for (const countryFile of Object.values(loadedZip.files)) {
      try {
        const content = await countryFile.async("string")
        const json = JSON.parse(content)
        result_borders.push(json)
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
  return result_borders
}


async function downloadAndUnzipFlags() {
  const svgs = {}
  try {
    const response = await fetch(FLAGS_URL)
    const blob = await response.blob();
    const loadedZip = await JSZip.loadAsync(blob)

    for (const countryFile of Object.values(loadedZip.files)) {
      try {
        const content = await countryFile.async("string")
        svgs[countryFile.name.replace(".svg", "").replace("flags/", "")] = content
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

function convertAlpha3to2(code: string) {


  for (const [two, three] of Object.entries(convert3to2alpha)) {
    if (code === three) {
      return two
    }
  }

  console.log(code, "not found")
}

export const getCountry = async (lat: number, lng: number) => {
  if (!get(borders)) return [undefined, undefined]
  if (!bordersFeatureCollections) return
  // api.getCountry(lat, lng)
  // geometries[country]?.feature?.geometry
  const flags = await svgs
  const allBorders = await bordersFeatureCollections
  for (const borders of allBorders) {
    // console.log(borders)
    for (const feature of borders.features) {
      let contains: FeatureCollection
      if (feature?.geometry) {
        contains = pointsWithinPolygon(point([lng, lat]), feature)
      }
      if (contains.features.length > 0) {
        const svg = flags[convertAlpha3to2(feature.properties.shapeGroup.substring(0, 3))]
        if (get(bordersAdmin)) return [borders, svg]
        else return [feature, svg]
      }
    }
  }
  return [undefined, undefined]
}
