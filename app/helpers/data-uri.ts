import { helper } from '@ember/component/helper'

export function dataUri([imageData, contentType]: [string, string]) {
    return `data:${contentType};base64,${imageData}`
}

export default helper(dataUri)
