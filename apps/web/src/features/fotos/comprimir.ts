const LADO_MAXIMO = 1600
const CALIDAD = 0.72

/** Reduce la foto a ≤1600 px por lado y JPEG ~0.72 antes de subirla (datos móviles, límite de Apps Script). */
export async function comprimirFoto(archivo: File): Promise<Blob> {
  const imagen = await createImageBitmap(archivo)
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height))
  const lienzo = document.createElement('canvas')
  lienzo.width = Math.round(imagen.width * escala)
  lienzo.height = Math.round(imagen.height * escala)
  lienzo.getContext('2d')!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height)
  imagen.close()
  return new Promise((resolver, rechazar) =>
    lienzo.toBlob(
      (blob) => (blob ? resolver(blob) : rechazar(new Error('No se pudo procesar la foto.'))),
      'image/jpeg',
      CALIDAD,
    ),
  )
}
