import { Link } from "react-router";
import { Calendar, Users, Shield } from "lucide-react";
import { useState } from "react";
import { Star } from "lucide-react";

import React from "react";

function Landing() {
  return (
    <>
      <nav className="bg-white/80 border-b border-[var(--color-gray-200)] shadow-[0_4px_6px_rgba(0,0,0,0.1)] fixed top-0 z-50 px-8 py-4 flex flex-wrap items-center justify-between min-w-screen">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 shadow-lg"></div>

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
      
      <section className="min-h-screen flex justify-center items-center p-24">
        <div className="border-black border-2 flex flex-col justify-between">
          <div className="top-container min-w-full flex justify-between">
            <div className="left-side border-2 border-green-400 w-[60%] flex items-center">
              <p className="text-7xl/24 font-bold">this is a sample slogan long as hell</p>
            </div>
            
            <div className="right-side border-2 border-red-400 w-[40%] min-h-[400px]">

            </div>
          </div>
          
          <div className="bottom-container min-w-full p-8 px-40">
            <p className="text-center italic">“Since switching to SyncSpace, managing projects and communication has been effortless. Everything we need to stay in sync is right here.”</p>
          </div>          
        </div>
      </section>
    </>
  );
}



export default Landing;
