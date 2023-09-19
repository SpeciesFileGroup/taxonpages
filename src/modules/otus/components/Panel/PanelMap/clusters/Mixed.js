export function Mixed(cluster) {
  return {
    html: `
    <div class="relative flex w-[40px] h-[40px]">
      <div class="rounded-l-full bg-map-collection-object bg-opacity-60">
        <div class="w-[15px] h-[30px] rounded-l-full bg-map-collection-object ml-[5px] mt-[5px]"></div>
      </div>
      <div class="rounded-r-full bg-map-type-material bg-opacity-60">
        <div class="w-[15px] h-[30px] rounded-r-full bg-map-type-material mr-[5px] mt-[5px]"></div>
      </div>
      <span class="absolute text-xs top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
        ${cluster.getChildCount()}
      </span>
    </div>`,
    className: 'leaflet-marker-icon leaflet-zoom-animated leaflet-interactive',
    iconSize: [40, 40]
  }
}
