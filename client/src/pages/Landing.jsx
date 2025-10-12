import { Link } from "react-router";
import { Calendar, Users, Shield } from "lucide-react";
import { useState } from "react";
import { Star } from "lucide-react";
import landing_page_pic from "../assets/landing_page_pic.png";
import React from "react";

function Landing() {
  return (
    <>
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[var(--color-gray-200)] shadow-[0_4px_6px_rgba(0,0,0,0.1)] sticky top-0 z-50 px-8 py-4 flex flex-wrap items-center justify-between w-full">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>

        <div className="flex items-center gap-3">
          <img
            src="/icon.png" 
            alt="SyncSpace Logo"
            className="w-10 h-10 object-contain"
          />
          <h1 className="text-2xl font-semibold tracking-wide">
            <span className="bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] bg-clip-text text-transparent">
            SyncSpace
            </span>
          </h1>
        </div>

        <div className="flex gap-6">
          <a href="#" className="hover:text-blue-500 transition">Home</a>
          <a href="#" className="hover:text-blue-500 transition">About</a>
          <a href="#" className="hover:text-blue-500 transition">Contact</a>
        </div>

        <div className="flex gap-4 mt-3 sm:mt-0">
          <button className="px-4 py-2 border border-[var(--color-gray-300)] rounded-[var(--radius-md)] font-small hover:bg-[var(--color-blue-200)] transition">
            Login
          </button>
          <button className="px-5 py-2 rounded-[var(--radius-md)] font-small text-white bg-[var(--color-secondary)] shadow-md hover:bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)]">
            Sign Up
          </button>
        </div>
      </nav>
      
      <section className="min-h-[calc(100vh-4rem)] flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row items-center gap-12 mb-8 sm:mb-16">
            <div className="flex-1 space-y-8">
              <h1 className="text-center sm:text-left text-4xl sm:text-6xl font-bold leading-tight">
                Connect. Create.<br />
                And <span className="bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] bg-clip-text text-transparent">Collaborate</span>.
              </h1>
              <p className="text-sm text-gray-600 sm:text-lg max-w-2xl text-center sm:text-left">
                Transform the way your team works together. Experience seamless collaboration 
                and project management with SyncSpace.
              </p>
              <div className="flex justify-center sm:justify-start gap-4">
                <button className="px-8 py-3 rounded-lg font-medium text-white bg-[var(--color-secondary)] shadow-md hover:bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-info)] transition-all">
                  Get Started
                </button>
                <button className="px-8 py-3 rounded-lg font-medium border border-[var(--color-gray-300)] hover:bg-gray-50 transition-all">
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
              "Since switching to SyncSpace, managing projects and communication has been effortless. Everything we need to stay in sync is right here."
            </blockquote>
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Join thousands of teams already using SyncSpace
            </p>
          </div>          
        </div>
      </section>
    </>
  );
}



export default Landing;
