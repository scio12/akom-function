import { z } from "zod";

export const requestBodySchema = z.object({
  pdfInfo: z.object({
    suratKe: z.string().min(1),
    tanggalPembuatan: z.string().min(1),
    jadwalReguler: z.string().min(1),
    waktuReguler: z.string().min(1),
    kelas: z.array(z.object({ value: z.string().min(1) })),
  }),
  userInfo: z.object({
    "next-auth.csrf-token": z.string().optional(),
    "next-auth.callback-url": z.string().url().optional(),
    "next-auth.session-token": z.string().optional(),

    "__Host-next-auth.csrf-token": z.string().optional(),
    "__Secure-next-auth.callback-url": z.string().url().optional(),
    "__Secure-next-auth.session-token": z.string().optional(),
  }),
});
