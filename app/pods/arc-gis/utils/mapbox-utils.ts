import { Map } from 'mapbox-gl'
import RSVP from 'rsvp'

interface IRawImage {
    width: number
    height: number
    data: Uint8Array | Uint8ClampedArray
}

const loadImageIntoMapInstance = (
    image: string | IRawImage,
    imageName: string,
    mapInstance: Map,
) => {
    const loadImage = RSVP.denodeify(mapInstance.loadImage.bind(mapInstance))

    return new Promise(async (resolve, reject) => {
        try {
            if (!mapInstance.hasImage(imageName)) {
                let imageData

                if (typeof image === 'string') {
                    if (!/^(https?)/.test(image)) {
                        // add a forward slash to the image unless it is a data url
                        if (image[0] !== '/' && !/^data:/.test(image)) {
                            image = `/${image}`
                        }
                    }

                    imageData = await loadImage(image)
                } else {
                    imageData = image
                }

                try {
                    // @ts-ignore
                    mapInstance.addImage(imageName, imageData)
                } catch (error) {
                    console.error(error)
                }
            }
        } catch (e) {
            console.error(e)
            reject(e)
        }

        resolve(imageName)
    })
}

export { loadImageIntoMapInstance }
