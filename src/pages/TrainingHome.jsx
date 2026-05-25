import { useState } from 'react'
import Hero from '../components/Hero.jsx'
import PromptMechanics from '../components/PromptMechanics.jsx'
import PromptAnatomy from '../components/PromptAnatomy.jsx'
import ModuleGrid from '../components/ModuleGrid.jsx'
import ModuleDrawer from '../components/ModuleDrawer.jsx'
import StylePlayground from '../components/StylePlayground.jsx'
import PracticeTool from '../components/PracticeTool.jsx'
import TemplateLibrary from '../components/TemplateLibrary.jsx'
import SectionSidebar from '../components/SectionSidebar.jsx'

export default function TrainingHome() {
  const [activeModule, setActiveModule] = useState(null)
  return (
    <>
      <SectionSidebar />
      <Hero />
      <PromptMechanics />
      <PromptAnatomy />
      <ModuleGrid onSelect={setActiveModule} />
      <StylePlayground />
      <PracticeTool />
      <TemplateLibrary />
      <ModuleDrawer module={activeModule} onClose={() => setActiveModule(null)} />
    </>
  )
}
