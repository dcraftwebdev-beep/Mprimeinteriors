import React from 'react'
import Hero from '../../components/Hero/Hero.jsx'
import AboutSection from './Components/AboutSection/AboutSection.jsx'
import FeatureSection from './Components/FeatureSection/FeatureSection.jsx';
import ProcessSection from './Components/ProcessSection/ProcessSection.jsx';
import TransformationSection from './Components/Transformationsection/Transformationsection.jsx';
import AIWowSection from './Components/AIWowSection/AIWowSection.jsx';
// import About from '../../components/About/About.jsx'
// import Services from '../../components/Services/Services.jsx'
console.log({ Hero, AboutSection }); // one logs undefined
const Home = () => {
  return (
    <>
      <Hero />
      <AboutSection />
      <FeatureSection />
      <ProcessSection />
      <TransformationSection />
      <AIWowSection />
    </>
  )
}

export default Home