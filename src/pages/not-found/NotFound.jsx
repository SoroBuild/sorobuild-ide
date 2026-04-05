import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft2, Warning2 } from "iconsax-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative flex min-h-screen items-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.08),_transparent_30%)]" />

        <div className="relative mx-auto w-full max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 text-center lg:order-1 lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                <Warning2 size="18" color="currentColor" />
                <span>Error 404</span>
              </div>

              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Page not found
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                The page you are looking for does not exist, may have been
                moved, or the link may be incorrect. Let’s get you back to a
                valid part of SoroBuild.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <ArrowLeft2 size="18" color="currentColor" />
                  <span className="ml-2">Return to homepage</span>
                </Link>

                <Link
                  to="/contract"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Go to Studio
                </Link>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:max-w-lg sm:p-8">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-3 rounded-full bg-rose-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>

                  <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                    <p className="text-6xl font-bold tracking-tight text-slate-900 sm:text-7xl">
                      404
                    </p>
                    <p className="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                      Not Found
                    </p>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="h-3 rounded-full bg-slate-200" />
                    <div className="h-3 w-5/6 rounded-full bg-slate-200" />
                    <div className="h-3 w-2/3 rounded-full bg-slate-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
