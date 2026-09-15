/** Foto elegida en el navegador y su ciclo de subida. Solo `remotoId` viaja en la constancia. */
export type FotoLocal = {
  id: string
  url: string
  nombre: string
  estado: 'subiendo' | 'lista' | 'error'
  remotoId: string | null
}

export type CambioFotos = (actualizar: (previas: FotoLocal[]) => FotoLocal[]) => void

export const idsSubidos = (fotos: FotoLocal[]) =>
  fotos.flatMap((f) => (f.estado === 'lista' && f.remotoId ? [f.remotoId] : []))

export const haySubidasPendientes = (fotos: FotoLocal[]) =>
  fotos.some((f) => f.estado === 'subiendo')
