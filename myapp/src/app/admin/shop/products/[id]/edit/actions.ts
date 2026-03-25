'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export async function deleteProductAction(productId: string) {
  await prisma.product.delete({ where: { id: productId } })
  redirect('/admin/shop/products')
}
