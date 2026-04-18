import Navbar from './Navbar';
import Hero from './Hero';
import Features from './Features';
import HowItWorks from './HowItWorks';

export default function Landing() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <Hero />
            <Features />
            <HowItWorks />
        </div>
    );
}
