
import borders from '../../../variables/borders';

import pointsWithinPolygon from "@turf/points-within-polygon"
import { point, type FeatureCollection } from "@turf/helpers"



export const getCountry = (lat: number, lng: number) => {
  //geometries[country]?.feature?.geometry
  for (const country of borders.features) {
    let contains: FeatureCollection
    if (country?.geometry) {
      contains = pointsWithinPolygon(point([lng, lat]), country)
    }
    if (contains.features.length > 0) {
      return country
    }
  }
}
