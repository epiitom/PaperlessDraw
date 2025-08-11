import React from 'react'
import Container from "@/components/Container"
import Navbar from "@/components/navbar"
import New from "@/components/Hero"
import {FeaturesSection} from "@/components/Feature"
import PricingSection from "@/components/pricing-section"
import {AnimatedTestimonialsDemo} from "@/components/maintesti"
const page = () => {
  return (
    <div className=" min-h-screen overflow-hidden w-full bg-[#0a0a0a] ">
   <Container>
    <Navbar></Navbar>
     <New></New>

     <FeaturesSection></FeaturesSection>
     <AnimatedTestimonialsDemo></AnimatedTestimonialsDemo> 
    <PricingSection></PricingSection>
  </Container>

    </div>
  )
}

export default page
