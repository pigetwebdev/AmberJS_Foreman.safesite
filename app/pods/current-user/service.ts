// import { computed, get, set } from '@ember/object'
// import { oneWay } from '@ember/object/computed'
import Service from '@ember/service'
// import { isBlank } from '@ember/utils'
// import jwtDecode from 'jwt-decode'

export default class CurrentUser extends Service.extend() {}
// profile: computed('session.data.authenticated', {
//   get() {
//     const idToken = get(this, 'session.data.authenticated.id_token')
//
//     if (isBlank(idToken)) {
//       return {}
//     }
//
//     const profile = jwtDecode(idToken)
//     set(this, '_data', profile)
//
//     return profile
//   }
// }),
//
// roles: oneWay('profile.roles'),
// email: oneWay('profile.email'),
//
// fullName: computed('profile.{given_name,family_name}', {
//   get() {
//     return `${get(this, 'profile.given_name')} ${get(this, 'profile.family_name')}`
//   }
// })
// })

declare module '@ember/service' {
    interface Registry {
        currentUser: CurrentUser
    }
}
