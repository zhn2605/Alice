interface Step {
    title: string;
    body: string;
}

const STEPS: Step[] = [
    {
        title: 'Paste a URL',
        body: 'Drop any supported product link into your dashboard.',
    },
    {
        title: 'Pick sizes',
        body: 'Choose which sizes to watch, or leave blank to track the whole product.',
    },
    {
        title: 'Get pinged',
        body: 'Alice pings your Discord the moment a tracked size restocks.',
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="bg-cream section-y">
            <div className="container-page">
                <h2 className="font-fashion text-title font-semibold tracking-tight text-center text-moss mb-[var(--section-gap)]">
                    How it works
                </h2>
                <ol className="grid md:grid-cols-3 gap-[var(--grid-gap)]">
                    {STEPS.map((s, i) => (
                        <li key={s.title} className="space-y-[var(--card-gap)] text-rose">
                            <div className="w-[var(--step-size)] h-[var(--step-size)] rounded-full bg-moss text-cream flex items-center justify-center font-semibold text-button">
                                {i + 1}
                            </div>
                            <h3 className="font-semibold text-heading">{s.title}</h3>
                            <p className="text-body text-neutral-600">{s.body}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
