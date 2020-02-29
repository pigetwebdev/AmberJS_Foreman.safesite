import { helper } from '@ember/component/helper'
import { area, AllGeoJSON } from '@turf/turf'

export function turfArea(params: AllGeoJSON[]) {
    const polygonArea = area(params[0])

    return polygonArea.toFixed()
}

export default helper(turfArea)
