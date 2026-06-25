import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public props: Props;
  public state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught luxury exception at Myra Atelier Boundary:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      // Clear key custom caches that might be corrupted
      localStorage.removeItem("myra_cart");
      localStorage.removeItem("myra_member_profile");
      localStorage.removeItem("myra_products");
      localStorage.removeItem("myra_orders");
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  private handleReloadOnly = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="max-w-md w-full border border-stone-200 bg-white p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-900 via-[#C68B59] to-stone-900" />
            
            {/* Elegant Logo Header */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#8A7968] tracking-[0.25em]">Myra Luxury Atelier</span>
              <h1 className="text-2xl font-serif font-medium text-stone-950">Aesthetic Alignment</h1>
            </div>

            <div className="w-16 h-16 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center mx-auto text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              We encountered a slight discrepancy in the digital presentation model. Rest assured, your luxury session data is preserved.
            </p>

            {/* Error Message Details */}
            {this.state.error && (
              <div className="bg-stone-50 border border-stone-100 p-3 rounded-xl text-left">
                <p className="text-[9px] font-mono text-stone-400 uppercase font-semibold">Diagnostic Report</p>
                <p className="text-[10px] font-mono text-stone-700 break-words mt-1 leading-normal line-clamp-3">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                id="error-boundary-reload-btn"
                onClick={this.handleReloadOnly}
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-800 hover:bg-stone-50 text-xs font-semibold cursor-pointer transition-colors"
              >
                Refresh Showroom
              </button>
              <button
                id="error-boundary-reset-btn"
                onClick={this.handleReset}
                className="flex-1 px-4 py-2.5 rounded-xl bg-stone-950 text-white hover:bg-leather-tan text-xs font-semibold cursor-pointer transition-all duration-300"
              >
                Reset Atelier Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
