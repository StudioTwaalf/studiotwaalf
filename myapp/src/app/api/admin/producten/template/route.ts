export async function GET() {
  const csv = [
    'naam,categorie_slug,prijs_euro,actief,webshop,personaliseerbaar,voorraad',
    'Geboortekaartje Ella,geboortekaartjes,2.50,ja,ja,ja,',
    'Huwelijksuitnodiging klassiek,huwelijksuitnodigingen,3.00,ja,ja,nee,50',
  ].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="producten-sjabloon.csv"',
    },
  })
}
