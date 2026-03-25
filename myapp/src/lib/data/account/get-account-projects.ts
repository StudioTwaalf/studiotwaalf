import type { Project } from '@/types/account'

function daysAgo(n: number, base = '2026-03-18T12:00:00Z'): string {
  const d = new Date(base)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

/**
 * Fetch all designs for the authenticated user, mapped to Project summaries.
 *
 * TODO — replace mock with:
 *   import { prisma } from '@/lib/prisma'
 *   const designs = await prisma.design.findMany({
 *     where:   { userId },
 *     orderBy: { updatedAt: 'desc' },
 *     include: {
 *       template: { select: { id: true, category: true, thumbnail: true } },
 *       _count:   { select: { gadgets: true } },
 *     },
 *   })
 *   return designs.map(mapDesignToProject)
 */
export async function getAccountProjects(userId: string): Promise<Project[]> {
  void userId

  return [
    {
      id:          'proj-1',
      designId:    'design-abc123',
      templateId:  'tpl-geboorte-01',
      name:        'Geboortekaartje Nathalie & Thomas',
      category:    'Geboorte',
      status:      'wacht_op_akkoord',
      thumbnail:   null,
      updatedAt:   daysAgo(1),
      gadgetCount: 3,
    },
    {
      id:          'proj-2',
      designId:    'design-def456',
      templateId:  'tpl-huwelijk-01',
      name:        'Huwelijksuitnodiging Sofie & Luca',
      category:    'Huwelijk',
      status:      'in_productie',
      thumbnail:   null,
      updatedAt:   daysAgo(5),
      gadgetCount: 2,
    },
    {
      id:          'proj-3',
      designId:    'design-ghi789',
      templateId:  'tpl-doopsel-01',
      name:        'Doopsuiker Emma',
      category:    'Doopsel',
      status:      'offerte_aangevraagd',
      thumbnail:   null,
      updatedAt:   daysAgo(3),
      gadgetCount: 4,
    },
    {
      id:          'proj-4',
      designId:    'design-jkl012',
      templateId:  'tpl-cadeau-01',
      name:        'Gepersonaliseerde verjaardagskaart',
      category:    'Cadeau',
      status:      'concept',
      thumbnail:   null,
      updatedAt:   daysAgo(0),
      gadgetCount: 0,
    },
    {
      id:          'proj-5',
      designId:    'design-mno345',
      templateId:  'tpl-geboorte-02',
      name:        'Geboortekaartje Floor',
      category:    'Geboorte',
      status:      'afgeleverd',
      thumbnail:   null,
      updatedAt:   daysAgo(30),
      gadgetCount: 2,
    },
    {
      id:          'proj-6',
      designId:    'design-pqr678',
      templateId:  'tpl-concept-01',
      name:        'Totaalconcept babyborrel',
      category:    'Concept',
      status:      'in_opbouw',
      thumbnail:   null,
      updatedAt:   daysAgo(2),
      gadgetCount: 6,
    },
  ]
}
