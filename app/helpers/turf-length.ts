import { helper } from '@ember/component/helper'
import { length, AllGeoJSON } from '@turf/turf'

export function turfLength(params: AllGeoJSON[]) {
    const [line] = params
    return length(line).toPrecision(3)
}

export default helper(turfLength)
