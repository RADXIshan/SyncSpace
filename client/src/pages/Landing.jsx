import { Link } from "react-router";
import { Calendar, Users, Shield, Star, X, CheckCheck } from "lucide-react";
import { useState } from "react";
import landing_page_pic from "../assets/landing_page_pic.png";
import React from "react";

function Landing() {
  return (
    <>
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[var(--color-gray-200)] shadow-[0_4px_6px_rgba(0,0,0,0.1)] top-0 z-50 px-8 py-4 flex flex-wrap items-center justify-between w-full">
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
      
      <section className="min-h-[calc(100vh-4rem)] flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
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

      <section id="comparison" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
              Why Choose <span className="gradient-text">SyncSpace</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-4">
              See the difference between traditional tools and our unified collaboration platform
            </p>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            {/* Others Card */}
            <div className="group relative flex flex-col">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
              <div className="relative flex flex-col h-full p-6 sm:p-8 lg:p-10 rounded-3xl bg-white border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                {/* Header */}
                <div className="flex items-center justify-center lg:justify-start mb-6 sm:mb-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center mr-3 sm:mr-4">
                    <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-800">Others</h3>
                </div>

                {/* Content Points */}
                <div className="flex-1 space-y-4 sm:space-y-5">
                  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-100/50 transition-all duration-300 group/item min-h-[4rem] sm:min-h-[4.5rem]">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center mt-1">
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                    </div>
                    <p className="font-medium text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed group-hover/item:text-gray-900 transition-colors flex-1">
                      Scattered tools for chat, tasks, and meetings
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-100/50 transition-all duration-300 group/item min-h-[4rem] sm:min-h-[4.5rem]">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center mt-1">
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                    </div>
                    <p className="font-medium text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed group-hover/item:text-gray-900 transition-colors flex-1">
                      Generic access for all users — no role control
                    </p>
                  </div>

                  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-100/50 transition-all duration-300 group/item min-h-[4rem] sm:min-h-[4.5rem]">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center mt-1">
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                    </div>
                    <p className="font-medium text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed group-hover/item:text-gray-900 transition-colors flex-1">
                      Complex, bloated interfaces not suited for small teams
                    </p>
                  </div>

                  <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-100/50 transition-all duration-300 group/item min-h-[4rem] sm:min-h-[4.5rem]">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center mt-1">
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                    </div>
                    <p className="font-medium text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed group-hover/item:text-gray-900 transition-colors flex-1">
                      Switching between multiple apps causes confusion
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SyncSpace Card */}
            <div className="group relative flex flex-col">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 to-indigo-500/30 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
              <div className="relative flex flex-col h-full p-6 sm:p-8 lg:p-10 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-center lg:justify-start mb-6 sm:mb-8">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-3 sm:mr-4">
                      <CheckCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white">SyncSpace</h3>
                  </div>

                  {/* Content Points */}
                  <div className="flex-1 space-y-4 sm:space-y-5">
                    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 group/item border border-white/20 min-h-[4rem] sm:min-h-[4.5rem]">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-400/20 flex items-center justify-center mt-1">
                        <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-300" />
                      </div>
                      <p className="font-medium text-sm sm:text-base lg:text-lg text-white leading-relaxed group-hover/item:text-green-100 transition-colors flex-1">
                        Unified platform combining chat, tasks, and meetings
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 group/item border border-white/20 min-h-[4rem] sm:min-h-[4.5rem]">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-400/20 flex items-center justify-center mt-1">
                        <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-300" />
                      </div>
                      <p className="font-medium text-sm sm:text-base lg:text-lg text-white leading-relaxed group-hover/item:text-green-100 transition-colors flex-1">
                        Role-based permissions for secure and organized teamwork
                      </p>
                    </div>

                    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 group/item border border-white/20 min-h-[4rem] sm:min-h-[4.5rem]">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-400/20 flex items-center justify-center mt-1">
                        <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-300" />
                      </div>
                      <p className="font-medium text-sm sm:text-base lg:text-lg text-white leading-relaxed group-hover/item:text-green-100 transition-colors flex-1">
                        Simple, modern UI built for students, startups, and agile teams
                      </p>
                    </div>

                    <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 group/item border border-white/20 min-h-[4rem] sm:min-h-[4.5rem]">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-400/20 flex items-center justify-center mt-1">
                        <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-300" />
                      </div>
                      <p className="font-medium text-sm sm:text-base lg:text-lg text-white leading-relaxed group-hover/item:text-green-100 transition-colors flex-1">
                        Seamless workflow — everything happens in one place
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}



export default Landing;
