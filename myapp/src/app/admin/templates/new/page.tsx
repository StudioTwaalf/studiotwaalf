import Link from 'next/link'
import { createTemplateAction, createAndBuildAction } from './actions'

export default function NewTemplatePage() {
  return (
    <div className="max-w-2xl">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/admin/templates" className="hover:text-gray-600 transition-colors">
          Templates
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">New template</span>
      </nav>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">Create template</h1>

        <form action={createTemplateAction} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name" name="name" type="text" required autoFocus
              placeholder="e.g. Geboortekaartje A6"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description" name="description" rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              id="category" name="category" type="text"
              placeholder="e.g. Geboorte, Huwelijk, Doopsel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="widthMm" className="block text-sm font-medium text-gray-700 mb-1">
                Width (mm)
              </label>
              <input
                id="widthMm" name="widthMm" type="number" step="0.1" min="0"
                placeholder="e.g. 148"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="heightMm" className="block text-sm font-medium text-gray-700 mb-1">
                Height (mm)
              </label>
              <input
                id="heightMm" name="heightMm" type="number" step="0.1" min="0"
                placeholder="e.g. 105"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="defaultDesignJson" className="block text-sm font-medium text-gray-700 mb-1">
              Default design JSON
            </label>
            <textarea
              id="defaultDesignJson" name="defaultDesignJson" rows={8}
              placeholder='{"version":1,"artboards":[...],"elements":[]}'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-y
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-lg
                         hover:bg-indigo-700 transition-colors"
            >
              Create template
            </button>
            <button
              formAction={createAndBuildAction}
              type="submit"
              className="bg-[#2C2416] text-white text-sm font-medium px-5 py-2 rounded-lg
                         hover:bg-[#3D3220] transition-colors"
            >
              Aanmaken + ontwerpen in builder →
            </button>
            <Link
              href="/admin/templates"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
