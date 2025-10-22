import { Star } from "lucide-react";
import landing_page_pic from "../assets/landing_page_pic.png";

const LandingHero = () => {
  return (
    <section className="min-h-[calc(100vh-4rem)] flex mt-14 justify-center items-center py-12 px-4 sm:px-6 lg:px-8 pt-28">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row items-center gap-12 mb-8 sm:mb-16">
            <div className="flex-1 space-y-8">
              <h1 className="text-center sm:text-left text-4xl sm:text-6xl font-bold leading-tight">
                Connect. Create.
                <br />
                And{" "}
                <span className="bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] bg-clip-text text-transparent">
                  Collaborate
                </span>
                .
              </h1>
              <p className="text-sm text-gray-600 sm:text-lg max-w-2xl text-center sm:text-left">
                Transform the way your team works together. Experience seamless
                collaboration and project management with SyncSpace.
              </p>
              <div className="flex justify-center sm:justify-start gap-4">
                <button className="relative px-6 py-[9px] rounded-md font-semibold text-white bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] shadow-lg hover:shadow-lg  transition-all duration-300 overflow-hidden group cursor-pointer active:scale-95 text-lg">
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-info)] to-[var(--color-secondary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"></div>
                </button>
                <button className="relative px-6 py-2 rounded-lg font-semibold text-lg bg-purple-100 text-purple-800/70 group transition-all hover:text-purple-800 hover:bg-purple-100 duration-300 cursor-pointer active:scale-95 hover:shadow-md shadow-purple-200 border">
                  Learn More
                </button>
              </div>
            </div>

            <div className="flex-1 flex justify-center items-center">
              <img
                className="w-[15rem] sm:w-full max-w-md transform hover:scale-105 transition-transform duration-300"
                src={landing_page_pic}
                alt="Team collaboration illustration"
              />
            </div>
          </div>

          <div className="max-w-3xl mx-auto text-center space-y-6">
            <blockquote className="text-sm sm:text-xl text-gray-600 italic">
              "Since switching to SyncSpace, managing projects and communication
              has been effortless. Everything we need to stay in sync is right
              here."
            </blockquote>
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 text-yellow-400 fill-current"
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Join thousands of teams already using SyncSpace
            </p>
          </div>
        </div>
      </section>
  );
}

export default LandingHero;