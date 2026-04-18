export default function Navbar() {
    return (
        <nav className="sticky top-0 z-20 bg-espresso backdrop-blur">
            <div className="container-page h-[var(--nav-h)] flex items-center justify-between">
                <div className="flex items-center gap-[var(--nav-gap)] text-nav text-neutral-300">
                    <a href="#home" className="hover:text-white">Home</a>
                    <a href="#features" className="hover:text-white">Features</a>
                    <a href="#how-it-works" className="hover:text-white">How it works</a>
                </div>
                <a
                    href="/login"
                    className="btn-sm rounded-full bg-moss hover:bg-rose text-white font-medium text-nav"
                >
                    My closet
                </a>
            </div>
        </nav>
    );
}
