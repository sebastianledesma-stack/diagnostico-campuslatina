// Envío por Resend con 1 reintento (spec 6.1). Nunca lanza: devuelve true/false.
import { Resend } from "resend";
import { env } from "./env.js";

let resend;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function enviarMail(payload, { idempotencyKey } = {}) {
  if (!env.RESEND_API_KEY) {
    console.error("[mailer] Falta RESEND_API_KEY");
    return false;
  }
  resend ||= new Resend(env.RESEND_API_KEY);
  for (let intento = 1; intento <= 2; intento++) {
    try {
      // idempotencyKey: si /api/notify se llama dos veces, Resend no duplica el envío (ventana de 24 h).
      const { data, error } = await resend.emails.send({ from: env.MAIL_FROM, ...payload }, { idempotencyKey });
      if (!error) {
        console.log(`[mailer] enviado ${data?.id} → ${[].concat(payload.to).join(", ")}`);
        return true;
      }
      console.error(`[mailer] error (intento ${intento}/2)`, error);
    } catch (err) {
      console.error(`[mailer] excepción (intento ${intento}/2)`, err);
    }
    if (intento === 1) await sleep(1500);
  }
  return false;
}
