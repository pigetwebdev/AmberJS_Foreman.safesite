import { IControl } from 'mapbox-gl'

export default class BuildingExtrusionControl implements IControl {
    container!: HTMLElement
    button!: HTMLButtonElement

    insertControls() {
        this.container = document.createElement('div')
        this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
        this.button = document.createElement('button')
        this.button.className = 'mapbox-ctrl-building-extrusions bg-black'

        this.container.appendChild(this.button)
    }

    onAdd(map: mapboxgl.Map): HTMLElement {
        this.insertControls()

        this.container.addEventListener('click', () => {
            console.log
        })

        return this.container
    }

    onRemove(map: mapboxgl.Map): any {}
}
//
// insertControls() {
//   this.container = document.createElement('div');
//   this.container.classList.add('mapboxgl-ctrl');
//   this.container.classList.add('mapboxgl-ctrl-group');
//   this.container.classList.add('mapboxgl-ctrl-zoom');
//   this.zoomIn = document.createElement('button');
//   this.zoomOut = document.createElement('button');
//   this.container.appendChild(this.zoomIn);
//   this.container.appendChild(this.zoomOut);
// }
//
// onAdd(map) {
//   this.map = map;
//   this.insertControls();
//   this.zoomIn.addEventListener('click', () => {
//     this.map.zoomIn();
//   });
//   this.zoomOut.addEventListener('click', () => {
//     this.map.zoomOut();
//   });
//   return this.container;
// }
//
// onRemove() {
//   this.container.parentNode.removeChild(this.container);
//   this.map = undefined;
// }
