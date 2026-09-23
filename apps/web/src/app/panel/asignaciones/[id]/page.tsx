import { redirect } from 'next/navigation'

export default async function DetalleAsignacion({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/panel?evento=${encodeURIComponent((await params).id)}#operacion`)
}
