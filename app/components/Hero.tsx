export default function Hero() {
    return (
        <section
            id="home"
            className="relative overflow-hidden min-h-[calc(100vh-var(--nav-h))] bg-rose md:bg-transparent"
        >
            <div
                aria-hidden
                className="hidden md:block absolute inset-0 bg-rose"
            />
            <div
                aria-hidden
                className="hidden md:block absolute inset-0 bg-cream bg-[url('/collage.jpg')] bg-auto bg-repeat bg-top"
                style={{ clipPath: 'polygon(60% 0, 100% 0, 100% 100%, 40% 100%)' }}
            />
            <div
                aria-hidden
                className="md:hidden absolute top-0 left-0 right-0 h-[var(--hero-banner-h)] bg-cream"
            />

            <div className="relative z-10 container-page pt-[var(--hero-pt)] pb-[var(--hero-pb)] md:py-[var(--hero-py-md)] md:min-h-[calc(100vh-var(--nav-h))] md:flex md:items-center">
                <div className="max-w-[var(--hero-content-w)] space-y-[var(--hero-content-gap)]">
                    <h1 className="font-fashion text-hero font-semibold tracking-tight text-espresso">
                        Never miss a restock.
                    </h1>
                    <p className="font-fashion text-lead text-cream">
                        Alice watches your favorite products and notifies you the moment
                        a size is back in stock.
                    </p>
                    <div className="flex gap-[var(--btn-gap)] pt-[var(--hero-cta-pt)]">
                        <a
                            href="/signup"
                            className="btn-lg rounded-full bg-coral hover:bg-moss text-white font-medium text-button"
                        >
                            Get started
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
