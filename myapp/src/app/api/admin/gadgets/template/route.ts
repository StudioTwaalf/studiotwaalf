export async function GET() {
  const csv = [
    'naam,categorie_slug,prijs_euro,breedte_mm,hoogte_mm,diepte_mm,actief,diy,shop,personaliseerbaar,voorraad',
    'Glazen flesje,glas,1.50,30,120,10,ja,ja,nee,nee,',
    'Proefbuisje met kurk,papier-karton,1.10,30,120,8,ja,ja,nee,nee,20',
  ].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="gadgets-sjabloon.csv"',
    },
  })
}
