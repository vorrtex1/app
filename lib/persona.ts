export async function createPersonaInquiry({ userId, accountType, name, email }: { userId: string; accountType: 'customer' | 'worker'; name: string; email: string }) {
  if (!process.env.PERSONA_API_KEY || !process.env.PERSONA_TEMPLATE_ID) return { id: null, status: 'not_configured' }
  const response = await fetch('https://withpersona.com/api/v1/inquiries', { method: 'POST', headers: { Authorization: `Bearer ${process.env.PERSONA_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ data: { type: 'inquiry', attributes: { 'inquiry-template-id': process.env.PERSONA_TEMPLATE_ID, 'reference-id': userId, 'fields': { name, email, account_type: accountType } } } }) })
  if (!response.ok) throw new Error('Persona inquiry could not be created')
  const payload = await response.json()
  return { id: payload.data?.id ?? null, status: payload.data?.attributes?.status ?? 'created' }
}
