import { redirect } from 'next/navigation'

export default function NuevaAsignacion() {
  redirect('/panel?nuevo=1#operacion')
}
