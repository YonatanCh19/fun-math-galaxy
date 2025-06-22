
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'npm:resend@3.4.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const TO_EMAIL = 'pais.yonatan@gmail.com';
const FROM_EMAIL = 'onboarding@resend.dev'; // This is a default for testing, you can verify your own domain in Resend

const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, email, phone, message } = await req.json();

    const { data, error } = await resend.emails.send({
      from: `פנייה חדשה מאת ${name || 'אלמוני'} <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      subject: `פנייה חדשה באתר המשחקים`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
          <h2>פנייה חדשה התקבלה</h2>
          <p><strong>שם:</strong> ${name || 'לא נמסר'}</p>
          <p><strong>אימייל:</strong> ${email || 'לא נמסר'}</p>
          <p><strong>טלפון:</strong> ${phone || 'לא נמסר'}</p>
          <p><strong>הודעה:</strong></p>
          <p>${message}</p>
        </div>
      `,
      reply_to: email || undefined,
    });

    if (error) {
      console.error({ error });
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
