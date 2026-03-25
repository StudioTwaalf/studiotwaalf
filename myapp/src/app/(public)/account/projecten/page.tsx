import type { Metadata } from 'next'
import { getAccountProjects } from '@/lib/data/account/get-account-projects'
import PageIntro from '@/components/account/PageIntro'
import ProjectsGrid from '@/components/account/ProjectsGrid'

export const metadata: Metadata = {
  title: 'Mijn projecten — Studio Twaalf',
}

// TODO: Replace with session.user.id from getServerSession(authOptions)
const MOCK_USER_ID = 'user-1'

export default async function ProjectenPage() {
  const projects = await getAccountProjects(MOCK_USER_ID)

  return (
    <div>
      <PageIntro
        eyebrow="Mijn account"
        title="Projecten"
        body="Al je ontwerpen op één plek — van eerste schets tot afgeleverd product."
      />
      <ProjectsGrid projects={projects} />
    </div>
  )
}
