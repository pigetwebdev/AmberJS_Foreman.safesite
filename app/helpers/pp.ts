import { helper } from '@ember/component/helper'

export function pp(params: any) {
    return JSON.stringify(params)
}

export default helper(pp)
