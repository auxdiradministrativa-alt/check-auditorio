import type { Correo } from '../../aplicacion/puertos'

/** Correo saliente desde la cuenta dueña del script (requiere el permiso `script.send_mail`). */
export const correoGas: Correo = {
  enviar: (m) =>
    MailApp.sendEmail({
      to: m.para.join(','),
      subject: m.asunto,
      htmlBody: m.html,
      body: m.texto,
      name: 'Check Auditorio · Infraestructura',
    }),
  cuotaRestante: () => MailApp.getRemainingDailyQuota(),
}
