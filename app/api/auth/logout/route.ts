import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Fjern auth cookie
    const cookieStore = await cookies()
    cookieStore.delete('auth-token')

    console.log('✅ Bruker logget ut')

    return Response.json({
      message: 'Utlogging vellykket'
    })

  } catch (error) {
    console.error('Feil ved utlogging:', error)
    return Response.json({ 
      error: 'Kunne ikke logge ut' 
    }, { status: 500 })
  }
}
