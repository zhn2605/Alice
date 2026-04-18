interface Feature {
    title: string;
    body: string;
}

const FEATURES: Feature[] = [
    {
        title: 'Track any size',
        body: 'Pick specific sizes or track the whole product. Alice checks each one independently.',
    },
    {
        title: 'Discord notifications',
        body: 'Point Alice at a Discord webhook and get a rich embed the second something restocks.',
    },
    {
        title: 'Automatic re-checks',
        body: "Alice polls on a schedule so you don't have to keep refreshing product pages.",
    },
];

export default function Features() {
    return (
        <section id="features" className="section-y bg-espresso">
            <div className="container-page">
                <h2 className="font-fashion text-title font-semibold tracking-tight text-center text-cream mb-[var(--section-gap)]">
                    Features
                </h2>
                <div className="grid md:grid-cols-3 gap-[var(--grid-gap)]">
                    {FEATURES.map((f) => (
                        <div key={f.title} className="space-y-[var(--card-gap)] text-rose">
                            <h3 className="font-semibold text-heading">{f.title}</h3>
                            <p className="text-body text-cream">{f.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
