"use client"; // Client component for useEffect

// Import standard 'a' tag for links
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  TrendingUp,
  Trophy,
  Users,
  Award,
  HeartHandshake,
  MessageCircle,
  CheckCircle2,
  Car,
  Plane,
  Phone,
  Mail,
  MessageSquare,
  HelpCircle,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import Link from "next/link";
import Image from "next/image";

const partners = [
  { name: "HDFC ERGO", logo: "/logos/hdfc-ergo.png" },
  { name: "HDFC Life", logo: "/logos/hdfc-life.png" },
  { name: "Star Health", logo: "/logos/star-health.png" },
  { name: "LIC", logo: "/logos/lic.png" },
  { name: "Aditya Birla", logo: "/logos/aditya-birla.png" },
  { name: "TATA AIG", logo: "/logos/tata-aig.png" },
  { name: "National Insurance", logo: "/logos/national-insurance.png" },
  {
    name: "Care Health Insurance",
    logo: "/logos/care_health_insurance_logo.png",
  },
];

interface AosType {
  init: (options?: {
    duration?: number;
    once?: boolean;
    offset?: number;
    disable?: string | boolean;
  }) => void;
}

declare global {
  interface Window {
    AOS: AosType;
  }
}

// --- FAQ Data ---
const faqs = [
  {
    id: "faq1",
    question: "Mujhe kaunsi Health Insurance policy leni chahiye?",
    answer:
      "Yeh aapki family size, age, medical history, aur budget par depend karta hai. Hum aapki zaroorat samajh kar best plan suggest karte hain, jismein sahi coverage ho aur premium bhi affordable ho. Contact kijiye free consultation ke liye!",
  },
  {
    id: "faq2",
    question: "Claim process mein aap kaise help karte hain?",
    answer:
      "Hum sirf policy nahi bechte, claim settlement mein shuru se aakhir tak poori help karte hain. Hospital admission se lekar documentation, company follow-up, aur final payment tak, hum aapke saath rehte hain taaki aapko koi pareshani na ho. Hamara 100% settlement record isi service ka nateeja hai.",
  },
  {
    id: "faq3",
    question: "Kya mujhe Life Insurance ki zaroorat hai?",
    answer:
      "Agar aapki family (spouse, children, parents) aap par financially dependent hai, toh Life Insurance bohot zaroori hai. Yeh aapke na rehne par unki financial security (ghar ka kharcha, bachhon ki padhai, loan repayment) ensure karta hai. Hum aapko sahi cover amount (Sum Assured) choose karne mein help karenge.",
  },
  {
    id: "faq4",
    question: "Policy renewal miss ho jaye toh kya hoga?",
    answer:
      "Policy lapse hone par coverage khatam ho jaati hai. Agar is beech koi medical emergency aati hai, toh claim nahi milega. Health insurance mein waiting periods phir se shuru ho sakte hain. Isliye hum apne clients ko time par reminders bhejte hain (via Client Portal & direct contact) aur renewal process aasaan banate hain.",
  },
  {
    id: "faq5",
    question: "Aap kaun-kaun si companies ki policies offer karte hain?",
    answer:
      "Hum India ki top insurance companies jaise HDFC ERGO, Star Health, LIC, Aditya Birla, TATA AIG, National Insurance, Care Health, aur Liberty ke saath partnered hain, taaki aapko har category (Health, Life, Motor, etc.) mein best aur unbiased options mil sakein.",
  },
];

// --- Testimonial Data ---
const testimonials = [
  {
    id: "t1",
    quote:
      "Claim ke time pe Sunil ji ne bohot help ki. Hospital se lekar company tak sab coordinate kiya. Bina kisi tension ke poora settlement mil gaya. Highly recommended for their 100% claim support!",
    name: "Sunil shah",
    location: "Kolkata", // You can keep it generic or specific
  },
  {
    id: "t2",
    quote:
      "20 saal se SS Insurance ke saath hain. Sunil ji hamesha family ki tarah sahi aur honest salah dete hain, kabhi faltu policy nahi chipkaate. Poora bharosa hai in par.",
    name: "Sushil kejriwal",
    location: "Kolkata",
  },
  {
    id: "t3",
    quote:
      "Raat ko accident hua tha, samajh nahi aa raha tha kya karoon. Sunil ji ka phone on tha aur unhone turant cashless process guide kiya. Aisi personal service aur 24/7 support bohot rare hai.",
    name: "Sunil Agarwal.",
    location: "Kolkata",
  },
];

export default function LandingPage() {
  const [founderPhotoError, setFounderPhotoError] = useState(false);

  // Load and Initialize AOS via CDN
  useEffect(() => {
    let aosInitialized = false;
    let linkElement: HTMLLinkElement | null = null;
    let scriptElement: HTMLScriptElement | null = null;

    const initializeAos = () => {
      if (!aosInitialized && typeof window !== "undefined" && window.AOS) {
        window.AOS.init({
          duration: 800,
          once: true,
          offset: 50,
          disable: "mobile",
        });
        aosInitialized = true;
        // console.log("AOS Initialized");
      } else if (!aosInitialized) {
        // console.warn("AOS object not found yet.");
      }
    };

    const aosCssId = "aos-css";
    if (!document.getElementById(aosCssId)) {
      linkElement = document.createElement("link");
      linkElement.id = aosCssId;
      linkElement.href = "https://unpkg.com/aos@2.3.1/dist/aos.css";
      linkElement.rel = "stylesheet";
      document.head.appendChild(linkElement);
    }

    const aosScriptId = "aos-js";
    const existingScript = document.getElementById(
      aosScriptId
    ) as HTMLScriptElement | null;
    if (!existingScript) {
      scriptElement = document.createElement("script");
      scriptElement.id = aosScriptId;
      scriptElement.src = "https://unpkg.com/aos@2.3.1/dist/aos.js";
      scriptElement.async = true;
      scriptElement.onload = initializeAos;
      scriptElement.onerror = () => console.error("Failed to load AOS script.");
      document.body.appendChild(scriptElement);
    } else {
      initializeAos();
    }

    const timerId = setTimeout(initializeAos, 100);

    return () => {
      clearTimeout(timerId);
    };
  }, []);

  // Handler for image error
  const handleFounderPhotoError = () => {
    console.error(
      "Failed to load founder photo (/logos/Owner-photo.png). Using fallback."
    );
    setFounderPhotoError(true);
  };
  // Handler for partner logo errors
  const handleLogoError = (
    e: React.SyntheticEvent<HTMLElement, Event>,
    logoSrc: string
  ) => {
    console.error(`Failed to load logo: ${logoSrc}. Hiding image.`);
    (e.target as HTMLImageElement).style.display = "none";
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800 antialiased">
      {/* Header */}
      <header className="container mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between items-center border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-md z-50">
        <h1 className="text-3xl font-bold mb-2 sm:mb-0 text-gray-900">
          <ShieldCheck className="inline-block mr-2 text-blue-600" />
          SS Insurance
        </h1>
        <nav>
          {/* Use standard <a> tags */}
          <Button
            asChild
            variant="ghost"
            className="text-gray-700 hover:text-blue-600"
          >
            <Link href="/login">Client Login</Link>
          </Button>
          <Button
            asChild
            className="ml-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Link href="/signup">Client Sign Up</Link>
          </Button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="flex items-center bg-gradient-to-b from-gray-50 to-white py-24 md:py-32 lg:py-40">
          <div className="container mx-auto px-4 text-center">
            <h2
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight"
              data-aos="fade-down"
            >
              25+ Years of Trust.
              <br />
              <span className="text-blue-600">25000+ Claims Settled.</span>
            </h2>
            <p
              className="mt-4 text-lg md:text-xl font-medium text-gray-700"
              data-aos="fade-down"
              data-aos-delay="100"
            >
              Your Family&apos;s Safety is Our Responsibility.
            </p>
            <p
              className="mt-4 text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              Welcome to SS Insurance, founded by Sunil Kumar Shukla. We provide
              personal insurance guidance, ensuring your claims get settled
              efficiently. 100% Settlement Record.
            </p>
            <div
              className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <Button
                asChild
                size="lg"
                className="px-8 py-3 sm:px-10 sm:py-4 text-base sm:text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md hover:shadow-lg transition transform hover:scale-105"
              >
                <a href="#services">Explore Our Services</a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="px-8 py-3 sm:px-10 sm:py-4 text-base sm:text-lg border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-full border-2 hover:border-blue-700 transition transform hover:scale-105"
              >
                <a href="#contact">Get Free Consultation</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Social Proof / Trust Banner */}
        <section className="bg-blue-600 text-white py-12 sm:py-16">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center" data-aos="fade-up">
              <Trophy size={40} className="mb-2 text-yellow-300" />
              <span className="text-3xl sm:text-4xl font-bold">25000+</span>
              <span className="text-base sm:text-lg mt-1 opacity-90">
                Claims Settled
              </span>
            </div>
            <div
              className="flex flex-col items-center"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <Users size={40} className="mb-2 text-blue-200" />
              <span className="text-3xl sm:text-4xl font-bold">3000+</span>
              <span className="text-base sm:text-lg mt-1 opacity-90">
                Happy Clients
              </span>
            </div>
            <div
              className="flex flex-col items-center"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <Award size={40} className="mb-2 text-yellow-300" />
              <span className="text-3xl sm:text-4xl font-bold">25+</span>
              <span className="text-base sm:text-lg mt-1 opacity-90">
                Years Experience
              </span>
            </div>
          </div>
        </section>

        {/* Partner Logos Section */}
        <section className="bg-white py-12 sm:py-16">
          <div className="container mx-auto px-4" data-aos="fade-in">
            <h3 className="text-center text-xl sm:text-2xl font-semibold text-gray-500 mb-8 tracking-wide">
              Proudly Partnered With India&apos;s Top Insurers
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-x-8 sm:gap-x-12 gap-y-6">
              {partners.map((partner, index) => (
                <div
                  key={partner.name}
                  className="grayscale hover:grayscale-0 transition duration-300 ease-in-out transform hover:scale-105"
                  data-aos="zoom-in"
                  data-aos-delay={index * 50}
                >
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={120}
                    height={48}
                    className="h-10 sm:h-12 w-auto object-contain"
                    onError={(e) => handleLogoError(e, partner.logo)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="bg-gray-50 py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <h3
              className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900"
              data-aos="fade-up"
            >
              Comprehensive Insurance Solutions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {/* Service Cards */}
              <div
                className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center text-center transition transform hover:-translate-y-2 hover:shadow-xl"
                data-aos="fade-up"
              >
                <ShieldCheck size={40} className="text-blue-600 mb-4" />
                <h4 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-800">
                  Health Insurance
                </h4>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Best health plans from top companies. CMD members for Star,
                  Aditya Birla & Care.
                </p>
              </div>
              <div
                className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center text-center transition transform hover:-translate-y-2 hover:shadow-xl"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                <TrendingUp size={40} className="text-green-600 mb-4" />
                <h4 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-800">
                  Life & Investments
                </h4>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Secure your future and grow wealth. Proud CMD members for LIC
                  & HDFC Life.
                </p>
              </div>
              <div
                className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center text-center transition transform hover:-translate-y-2 hover:shadow-xl"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                <Car size={40} className="text-red-600 mb-4" />
                <h4 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-800">
                  Motor Insurance
                </h4>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Comprehensive cover for your car or bike against accidents,
                  theft, and damages.
                </p>
              </div>
              <div
                className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center text-center transition transform hover:-translate-y-2 hover:shadow-xl"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                <Plane size={40} className="text-purple-600 mb-4" />
                <h4 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-800">
                  Other Insurances
                </h4>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Including Term Plans, Travel Insurance, Business Cover, Fire
                  Insurance, and more. Ask us!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Us Section */}
        <section className="bg-gradient-to-b from-white to-blue-50 py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <h3
              className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900"
              data-aos="fade-up"
            >
              The SS Insurance Advantage
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div
                className="flex flex-col items-center p-4"
                data-aos="fade-up"
              >
                <Trophy size={40} className="text-blue-600 mb-3" />
                <h4 className="text-lg sm:text-xl font-semibold mb-1 text-gray-800">
                  Claims Expert
                </h4>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Hum sirf policy bechte nahi, claim settle karwaate hain! 100%
                  record.
                </p>
              </div>
              <div
                className="flex flex-col items-center p-4"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                <HeartHandshake size={40} className="text-blue-600 mb-3" />
                <h4 className="text-lg sm:text-xl font-semibold mb-1 text-gray-800">
                  Personal Service
                </h4>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Har client ko personal attention milti hai, hamesha.
                </p>
              </div>
              <div
                className="flex flex-col items-center p-4"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                <CheckCircle2 size={40} className="text-blue-600 mb-3" />
                <h4 className="text-lg sm:text-xl font-semibold mb-1 text-gray-800">
                  Honest Advice
                </h4>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Hum wohi policy dete hain jiski aapko zaroorat hai. No hidden
                  charges.
                </p>
              </div>
              <div
                className="flex flex-col items-center p-4"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                <MessageCircle size={40} className="text-blue-600 mb-3" />
                <h4 className="text-lg sm:text-xl font-semibold mb-1 text-gray-800">
                  24/7 Support
                </h4>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Aapki emergency mein hamara phone hamesha on rehta hai.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Founder Section */}
        <section className="bg-gray-50 py-20 sm:py-24">
          <div
            className="container mx-auto px-4 max-w-4xl"
            data-aos="fade-right"
          >
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-white p-8 rounded-lg shadow-lg">
              <div className="flex-shrink-0 w-40 h-40 sm:w-48 sm:h-48 rounded-lg border-4 border-gray-200 shadow-md overflow-hidden mx-auto md:mx-0">
                {/* Conditionally render image or fallback */}
                {!founderPhotoError ? (
                  <div className="relative w-[260px] h-[420px] overflow-hidden rounded-xl shadow-lg">
                    <Image
                      src="/logos/Owner-photo.png"
                      alt="Founder Photo"
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                ) : (
                  // Fallback: Show Award icon if image fails
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Award size={80} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-3xl sm:text-4xl font-bold mb-3 text-gray-900">
                  A Message from the Founder
                </h3>
                <p className="text-xl sm:text-2xl font-semibold text-gray-800">
                  Sunil Kumar Shukla
                </p>
                <p className="text-lg sm:text-xl font-medium text-blue-600 mb-4">
                  Founder, SS Insurance (CMD Member)
                </p>
                {/* Highlighted Quote */}
                <blockquote className="text-base sm:text-lg text-gray-700 leading-relaxed italic border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r-md">
                  &quot;With over 25 years in this industry, my mission has
                  never changed: to give you honest advice and to fight for you
                  when it matters most. Your peace of mind is my priority. Hum
                  sirf policy nahi bechte, ek vishwas ka rishta banate
                  hain.&quot;
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section
          id="testimonials"
          className="bg-white py-16 sm:py-20 border-t border-gray-100"
        >
          <div className="container mx-auto px-4 max-w-5xl" data-aos="fade-up">
            <h3 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">
              <Star className="inline-block mr-3 text-yellow-500" size={36} />
              What Our Clients Say
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={testimonial.id}
                  className="flex flex-col bg-gray-50 shadow-lg border border-gray-200 rounded-lg overflow-hidden transition transform hover:shadow-xl hover:-translate-y-1"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <CardHeader className="pb-4 pt-6 px-6">
                    {/* Simple Star Rating */}
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          fill="currentColor"
                          size={18}
                          className={i > 0 ? "ml-1" : ""}
                        />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow px-6 pb-6">
                    <p className="text-gray-700 italic leading-relaxed">
                      {testimonial.quote}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-4 pb-6 px-6 border-t bg-white mt-auto">
                    <p className="text-sm font-semibold text-gray-800">
                      {testimonial.name},{" "}
                      <span className="font-normal text-gray-500">
                        {testimonial.location}
                      </span>
                    </p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Client Portal CTA */}
        <section className="bg-blue-600 text-white py-16 sm:py-20">
          <div
            className="container mx-auto px-4 text-center"
            data-aos="zoom-in"
          >
            <h3 className="text-3xl sm:text-4xl font-bold mb-4">
              Already a Client?
            </h3>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              Access the Client Portal to view your policy documents, check due
              dates, and manage your portfolio securely online.
            </p>
            <Button
              asChild
              size="lg"
              className="px-8 py-3 sm:px-10 sm:py-4 text-base sm:text-lg bg-white text-blue-600 hover:bg-gray-100 rounded-full shadow-md hover:shadow-lg transition transform hover:scale-105"
            >
              {/* Use <a> */}
              <Link href="/login">Access Your Portal</Link>
            </Button>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="bg-white py-16 sm:py-20">
          <div className="container mx-auto px-4 max-w-3xl" data-aos="fade-up">
            <h3 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-gray-900">
              <HelpCircle
                className="inline-block mr-3 text-blue-600"
                size={36}
              />
              Frequently Asked Questions
            </h3>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  value={faq.id}
                  key={faq.id}
                  className="border border-gray-200 rounded-lg shadow-sm bg-gray-50/50 hover:bg-gray-100/70 transition-colors"
                  data-aos="fade-up"
                  data-aos-delay={index * 50}
                >
                  {" "}
                  {/* Added hover bg */}
                  <AccordionTrigger className="text-lg sm:text-xl text-left font-semibold hover:no-underline px-6 py-4 text-gray-800 group transition-colors">
                    {" "}
                    {/* Added group */}
                    {faq.question}
                    {/* Optional: Add rotating icon on open/close */}
                    {/* <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" /> */}
                  </AccordionTrigger>
                  <AccordionContent className="text-base sm:text-lg text-gray-600 leading-relaxed pt-0 pb-4 px-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Contact Section */}
        <section
          id="contact"
          className="bg-gray-100 py-16 sm:py-20 border-t border-gray-200"
        >
          <div
            className="container mx-auto px-4 text-center max-w-3xl"
            data-aos="fade-up"
          >
            <h3 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
              Ready to Secure Your Future?
            </h3>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
              Get personalized advice from an expert with 25+ years of
              experience. Contact Sunil Kumar Shukla today!
            </p>
            {/* Contact Details */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-8 text-base sm:text-lg font-semibold">
              <a
                href="tel:+919339119427"
                className="flex items-center text-blue-600 hover:text-blue-800 hover:underline transition transform hover:scale-105 p-2 rounded-md "
              >
                <Phone className="w-5 h-5 mr-2" /> +91 9339119427
              </a>
              <a
                href="mailto:sunilkumarshukla52@yahoo.com"
                className="flex items-center text-blue-600 hover:text-blue-800 hover:underline transition transform hover:scale-105 p-2 rounded-md "
              >
                <Mail className="w-5 h-5 mr-2" /> sunilkumarshukla52@yahoo.com
              </a>
            </div>
            {/* WhatsApp Button */}
            <Button
              asChild
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white rounded-full px-8 py-3 text-base sm:text-lg shadow-md hover:shadow-lg transition transform hover:scale-105"
            >
              {/* Use <a> */}
              <a
                href="https://wa.me/919339119427"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare className="w-5 h-5 mr-2" /> Chat on WhatsApp
              </a>
            </Button>
            {/* Google Map Embed (Optional) */}
            {/* Add map embed code here if needed */}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-6 sm:py-8">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} SS Insurance. All rights reserved.
          </p>
          <p className="mt-1">Built with ❤️ by Aditya Shukla</p>

          {/* Optional: Add privacy policy/terms links */}
        </div>
      </footer>
    </div>
  );
}
