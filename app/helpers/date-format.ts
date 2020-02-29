import { helper } from '@ember/component/helper'
import { DateTime } from 'luxon'

export function dateFormat([date, format = false]: [DateTime, string | false]) {
    if (!date) {
        return ''
    }
    if (format) {
        return date.toFormat(format)
    } else {
        return date.toLocaleString()
    }
}

export default helper(dateFormat)
